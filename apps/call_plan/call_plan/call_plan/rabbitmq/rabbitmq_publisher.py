import pika
import json
from call_plan.call_plan.connection import get_rabbitmq_connection

def send_to_rabbitmq(doc, method):
    connection = get_rabbitmq_connection()
    channel = connection.channel()
    
    queue_name = 'merchant_queue'
    channel.queue_declare(queue=queue_name)
    
    data = {
        'nama_merchantklinik': doc.nama_merchantklinik,
        'jenis_kunjungan': doc.jenis_kunjungan,
    }
    
    data_json = json.dumps(data)
    
    channel.basic_publish(
        exchange='',
        routing_key=queue_name,
        body=data_json,
        properties=pika.BasicProperties(
            delivery_mode=2,
        )
    )
    
    print(f" [x] Sent {data_json}")
    
    connection.close()

#API secret : 0c89eae64b8667f
#API key : 2e8923f1fced233
#(1)http://administration:8000/api/v2/document/Merchants/MERCHANT-18356
#(2)http://administration:8000/api/resource/Merchants/MERCHANT-18356