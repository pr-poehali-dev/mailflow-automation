import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def handler(event: dict, context) -> dict:
    """Валидация промокода: проверка существования, активности, лимитов, расчёт скидки."""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': False, 'error': 'method_not_allowed'})}

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': False, 'error': 'invalid_json'})}

    code = (body.get('code') or '').strip().upper()
    amount = body.get('amount')
    user_email = (body.get('user_email') or '').strip().lower()

    if not code:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': False, 'error': 'empty_code'})}

    if not isinstance(amount, (int, float)) or amount <= 0:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': False, 'error': 'invalid_amount'})}

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': False, 'error': 'no_db'})}

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, code, description, discount_type, discount_value,
                       max_uses, used_count, applies_to, valid_from, valid_until, is_active
                FROM promo_codes
                WHERE code = %s
                LIMIT 1
                """,
                (code,)
            )
            row = cur.fetchone()

            if not row:
                return {'statusCode': 200, 'headers': CORS_HEADERS,
                        'body': json.dumps({'ok': False, 'error': 'not_found', 'message': 'Промокод не найден'})}

            if not row['is_active']:
                return {'statusCode': 200, 'headers': CORS_HEADERS,
                        'body': json.dumps({'ok': False, 'error': 'inactive', 'message': 'Промокод отключён'})}

            cur.execute(
                """
                SELECT
                    (valid_until IS NOT NULL AND valid_until < CURRENT_TIMESTAMP) AS expired,
                    (valid_from IS NOT NULL AND valid_from > CURRENT_TIMESTAMP) AS not_started
                FROM promo_codes WHERE id = %s
                """,
                (row['id'],)
            )
            time_check = cur.fetchone()

            if time_check and time_check['expired']:
                return {'statusCode': 200, 'headers': CORS_HEADERS,
                        'body': json.dumps({'ok': False, 'error': 'expired', 'message': 'Срок действия промокода истёк'})}

            if time_check and time_check['not_started']:
                return {'statusCode': 200, 'headers': CORS_HEADERS,
                        'body': json.dumps({'ok': False, 'error': 'not_started', 'message': 'Промокод ещё не активен'})}

            if row['max_uses'] is not None and row['used_count'] >= row['max_uses']:
                return {'statusCode': 200, 'headers': CORS_HEADERS,
                        'body': json.dumps({'ok': False, 'error': 'limit_reached', 'message': 'Лимит использований исчерпан'})}

            if row['applies_to'] == 'first_purchase' and user_email:
                cur.execute(
                    "SELECT COUNT(*) AS c FROM orders WHERE LOWER(user_email) = %s AND status = 'paid'",
                    (user_email,)
                )
                paid_count = cur.fetchone()['c']
                if paid_count > 0:
                    return {'statusCode': 200, 'headers': CORS_HEADERS,
                            'body': json.dumps({'ok': False, 'error': 'not_first_purchase',
                                                'message': 'Промокод только для первой покупки'})}

            if user_email:
                cur.execute(
                    "SELECT COUNT(*) AS c FROM promo_code_uses WHERE promo_code_id = %s AND LOWER(user_email) = %s",
                    (row['id'], user_email)
                )
                used_by_user = cur.fetchone()['c']
                if used_by_user > 0:
                    return {'statusCode': 200, 'headers': CORS_HEADERS,
                            'body': json.dumps({'ok': False, 'error': 'already_used',
                                                'message': 'Вы уже использовали этот промокод'})}

            if row['discount_type'] == 'percent':
                discount = round(amount * row['discount_value'] / 100, 2)
            else:
                discount = min(float(row['discount_value']), amount)

            final_amount = max(amount - discount, 0)

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'ok': True,
                    'code': row['code'],
                    'description': row['description'],
                    'discount_type': row['discount_type'],
                    'discount_value': row['discount_value'],
                    'discount_amount': discount,
                    'final_amount': final_amount,
                    'original_amount': amount,
                })
            }
    finally:
        conn.close()