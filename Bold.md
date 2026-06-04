Proceso de Integración BETA
La API de Pagos de Bold está diseñada con una arquitectura REST simple y poderosa. Utiliza URL predecibles orientadas a recursos, acepta cuerpos de solicitud en formato JSON y emplea verbos HTTP estándar para interactuar con tus aplicaciones de manera intuitiva. Además, garantiza respuestas en JSON bien estructuradas y utiliza códigos de estado HTTP convencionales para facilitar el manejo de errores y respuestas.

Métodos de pago disponibles
Tarjeta de crédito/débito
PSE (Pagos Seguros en Línea)
Nequi
Botón Bancolombia
QR Bre-B
Para usar este método de pago, debes contar con una Cuenta Bold  y haber activado la funcionalidad de QR en tu cuenta.
Puedes consultar los detalles específicos de cada método de pago y los datos requeridos para cada uno en la sección de Esquema de datos de esta documentación.

Seguridad
La API funciona bajo un esquema de seguridad utilizando una llave de identidad (API key), la cual deberá ser enviada en las cabeceras de cada petición.

Autenticación de peticiones
Para autenticar tus peticiones, incluye la siguiente cabecera (header) en cada solicitud:

Llave	Valor
Authorization	x-api-key <llave_de_identidad>
Asegúrate de reemplazar <llave de identidad> con la correspondiente a tu comercio.

Por ejemplo, si la llave de identidad es:

DZSkDqh2iWmpYQg204C2fLigQerhPGXAcm5WyujxwYH
Quedaría de la siguiente forma:

Llave	Valor
Authorization	x-api-key DZSkDqh2iWmpYQg204C2fLigQerhPGXAcm5WyujxwYH
info
Importante: Recuerda para realizar pruebas en el ambiente de sandbox debes utilizar la llave de identidad correspondiente a pruebas. Para compras reales, usa la llave asignada a tu comercio para producción.

URL base
Todas las solicitudes a los servicios deben realizarse utilizando la siguiente URL base:

https://api.online.payments.bold.co

Response
Todas las solicitudes a los servicios responden bajo la estructura Response. Cada servicio devuelve en el campo payload un objeto definido según su funcionalidad.

Crea una intención de pago
Este endpoint permite iniciar un proceso de pago creando una “intención de pago”. Funciona como el primer paso en el flujo de procesamiento de pagos, donde registras los detalles de la transacción como el monto, la moneda, información del cliente y detalles del método de pago.

La intención de pago tiene un identificador único su reference_id que podrás utilizar para seguir y gestionar esta transacción a lo largo de su ciclo de vida.

Endpoint

POST /v1/payment-intent
Solicitud

Datos necesarios para crear un intento de pago.

Esquema: PaymentIntent

Content-Type: application/json

{
  "reference_id": "ORD-12345",
  "amount": {
    "currency": "COP",
    "total_amount": 100000,
    "tip_amount": 10000,
    "taxes": [
      {
        "type": "VAT",
        "base": 5000,
        "value": 500
      }
    ]
  },
  "description": "Compra de productos electrónicos",
  "callback_url": "https://mi-tienda.com/confirmacion-pago", //Requerido para los métodos de pagos PSE y Bancolombia.
  "metadata": 
    {
      "key": "promo_code",
      "value": "DESCUENTO10"
    },
  "customer": {
    "name": "Juan Pérez",
    "phone": "3001234567",
    "email": "juan.perez@example.com",
    "billing_address": {
      "street1": "Calle 123 #45-67",
      "street2": "Apto 202",
      "city": "Bogotá",
      "postal_code": "110111",
      "province": "Cundinamarca",
      "country_code": "CO",
      "phone": "3001234567"
    },
    "shipping_address": {
      "street1": "Carrera 98 #34-56",
      "street2": "Casa 5",
      "city": "Medellín",
      "postal_code": "050001",
      "province": "Antioquia",
      "country_code": "CO",
      "phone": "3012345678"
    }
  },
  "device_fingerprint": {
    "ip": "192.168.1.1",
    "device_type": "Smartphone",
    "os": "iOS 15.4",
    "browser": "Safari",
    "accept_header": "text/html,application/xhtml+xml",
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    "java_enabled": false,
    "language": "es-CO",
    "color_depth": 24,
    "screen_height": 844,
    "screen_width": 390,
    "time_zone_offset": -300,
    "latitude": "4.6097100",
    "longitude": "-74.0817500",
    "model": "iPhone 13",
    "platform": "iOS"
  }
}
Respuestas

200: Respuesta exitosa.
Esquema: PaymentIntentResponse
Content-Type: application/json
{
  "reference_id": "ORD-12345",
  "amount": {
    "currency": "COP",
    "total_amount": 100000,
    "tip_amount": 10000,
    "taxes": [
      {
        "type": "VAT",
        "base": 5000,
        "value": 500
      }
    ]
  },
  "description": "Compra de productos electrónicos",
  "creation_date": "192345678900",
  "status": "ACTIVE",
  "callback_url": "https://mi-tienda.com/confirmacion-pago",
  "metadata": {
    "key": "promo_code",
    "value": "DESCUENTO10"
  },
  "test": true,
  "customer": {
    "name": "Juan Pérez",
    "phone": "3001234567",
    "email": "juan.perez@example.com",
    "billing_address": {
      "street1": "Calle 123 #45-67",
      "street2": "Apto 202",
      "city": "Bogotá",
      "postal_code": "110111",
      "province": "Cundinamarca",
      "country_code": "CO",
      "phone": "3001234567"
    },
    "shipping_address": {
      "street1": "Carrera 98 #34-56",
      "street2": "Casa 5",
      "city": "Medellín",
      "postal_code": "050001",
      "province": "Antioquia",
      "country_code": "CO",
      "phone": "3012345678"
    }
  }
}
Errores

Esquema: Error
Content-Type: application/json
400: Error de validación.
409: Conflicto con referencia existente
403: Error en permisos
500: Error interno
info
Nota: Al enviar los datos del dispositivo (device_fingerprint) al crear la intención de pago, deben ser los datos reales del dispositivo tanto el tamaño de pantalla, el tipo de dispositivo, el sistema operativo, el navegador, entre otros. Esto es fundamental para que el motor de fraude pueda renderizar correctamente el formulario de autenticación 3D Secure (3DS) en caso de ser requerido.

Obtener la información de una intención de pago
Este endpoint te permite consultar todos los detalles de una intención de pago previamente creada utilizando su referencia única reference_id.

Es útil para verificar el estado actual de un pago, confirmar los detalles del pedido o para mostrar información actualizada al cliente sobre su transacción en proceso.

Endpoint

GET /v1/payment-intent/{reference_id} //Referencia de pago
Respuestas

200: Respuesta exitosa.
Esquema: PaymentIntentResponse
Content-Type: application/json
{
  "reference_id": "ORD-12345",
  "amount": {
    "currency": "COP",
    "total_amount": 100000,
    "tip_amount": 10000,
    "taxes": [
      {
        "type": "VAT",
        "base": 5000,
        "value": 500
      }
    ]
  },
  "description": "Compra de productos electrónicos",
  "creation_date": "192345678900",
  "status": "ACTIVE",
  "bold_transaction_id": "TXN1234567890",
  "callback_url": "https://mi-tienda.com/confirmacion-pago",
  "metadata": 
    {
      "key": "promo_code",
      "value": "DESCUENTO10"
    },
  "test": true,
  "customer": {
    "name": "Juan Pérez",
    "phone": "3001234567",
    "email": "juan.perez@example.com",
    "billing_address": {
      "street1": "Calle 123 #45-67",
      "street2": "Apto 202",
      "city": "Bogotá",
      "postal_code": "110111",
      "province": "Cundinamarca",
      "country_code": "CO",
      "phone": "3001234567"
    },
    "shipping_address": {
      "street1": "Carrera 98 #34-56",
      "street2": "Casa 5",
      "city": "Medellín",
      "postal_code": "050001",
      "province": "Antioquia",
      "country_code": "CO",
      "phone": "3012345678"
    }
  }
}
Errores

Esquema: Error

Content-Type: application/json

404: PaymentNotFound.
403: Error en permisos
500: Error interno
Actualizar la información de una intención de pago
Con este endpoint puedes modificar los datos de una intención de pago existente y aun no se haya pagado, como actualizar montos, información del cliente o cualquier otro parámetro relevante

Esto resulta especialmente útil cuando hay cambios en el pedido después de haber creado la intención inicial o cuando necesitas corregir información proporcionada anteriormente.

Endpoint

PUT /v1/payment-intent
Solicitud

Datos necesarios para actualizar una intención de pago.

Esquema: PaymentIntent

Content-Type: application/json

{
  "reference_id": "ORD-12345",
  "amount": {
    "currency": "COP",
    "total_amount": 100000,
    "tip_amount": 10000,
    "taxes": [
      {
        "type": "VAT",
        "base": 5000,
        "value": 500
      }
    ]
  },
  "description": "Compra de productos electrónicos",
  "creation_date": "192345678900",
  "status": "ACTIVE",
  "bold_transaction_id": "TXN1234567890",
  "callback_url": "https://mi-tienda.com/confirmacion-pago",
  "metadata": 
    {
      "key": "promo_code",
      "value": "DESCUENTO10"
    }
  ,
  "test": true,
  "customer": {
    "name": "Juan Pérez",
    "phone": "3001234567",
    "email": "juan.perez@example.com",
    "billing_address": {
      "street1": "Calle 123 #45-67",
      "street2": "Apto 202",
      "city": "Bogotá",
      "postal_code": "110111",
      "province": "Cundinamarca",
      "country_code": "CO",
      "phone": "3001234567"
    },
    "shipping_address": {
      "street1": "Carrera 98 #34-56",
      "street2": "Casa 5",
      "city": "Medellín",
      "postal_code": "050001",
      "province": "Antioquia",
      "country_code": "CO",
      "phone": "3012345678"
    }
  }
}
Respuestas

200: Respuesta exitosa.
Esquema: PaymentIntentResponse
Content-Type: application/json
{
  "reference_id": "ORD-12345",
  "amount": {
    "currency": "COP",
    "total_amount": 100000,
    "tip_amount": 10000,
    "taxes": [
      {
        "type": "VAT",
        "base": 5000,
        "value": 500
      }
    ]
  },
  "description": "Compra de productos electrónicos",
  "creation_date": "192345678900",
  "status": "ACTIVE",
  "bold_transaction_id": "TXN1234567890",
  "callback_url": "https://mi-tienda.com/confirmacion-pago",
  "metadata": 
    {
      "key": "promo_code",
      "value": "DESCUENTO10"
    }
  ,
  "test": true,
  "customer": {
    "name": "Juan Pérez",
    "phone": "3001234567",
    "email": "juan.perez@example.com",
    "billing_address": {
      "street1": "Calle 123 #45-67",
      "street2": "Apto 202",
      "city": "Bogotá",
      "postal_code": "110111",
      "province": "Cundinamarca",
      "country_code": "CO",
      "phone": "3001234567"
    },
    "shipping_address": {
      "street1": "Carrera 98 #34-56",
      "street2": "Casa 5",
      "city": "Medellín",
      "postal_code": "050001",
      "province": "Antioquia",
      "country_code": "CO",
      "phone": "3012345678"
    }
  }
}
Errores

Esquema: Error
Content-Type: application/json
404: PaymentNotFound.
403: Error en permisos
500: Error interno
Realizar un intento de pago
Este endpoint ejecuta el procesamiento efectivo del pago utilizando los datos del método de pago seleccionado por el cliente.

Es el paso que realmente inicia la autorización y captura de fondos basado en una intención de pago existente. Dependiendo del método de pago utilizado, puede requerir acciones adicionales como redirecciones para autenticación o confirmación por parte del usuario.

Endpoint

POST /v1/payment
Solicitud

Datos necesarios para crear un intento de pago.

Esquema: PaymentAttempt

Content-Type: application/json


{
  "reference_id": "ORD-123456",
  "metadata": 
    {
      "key": "campaign",
      "value": "black-friday"
    },
  "payer": {
    "person_type": "NATURAL_PERSON",
    "name": "Laura Gómez",
    "phone": "3001234567",
    "email": "laura.gomez@example.com",
    "document_type": "CEDULA",
    "document_number": "1012345678",
    "billing_address": {
      "street1": "Calle 123 #45-67",
      "street2": "Apto 202",
      "city": "Bogotá",
      "zip_code": "110111",
      "province": "Cundinamarca",
      "country": "CO",
      "phone": "3001234567"
    }
  },
  "payment_method": {  //Ver lista de métodos de pago que se pueden usar para el pago.
    "name": "CREDIT_CARD",
    "card_number": "4111111111111111",
    "cardholder_name": "Jhon Doe",
    "expiration_month": "12",
    "expiration_year": "2035",
    "installments": 1,
    "cvc": "123"
  },
  "device_fingerprint": {
        "device_type": "DESKTOP",
        "os": "Linux",
        "model": "",
        "browser": "Google Chrome or Chromium",
        "java_enabled": false,
        "language": "en",
        "color_depth": 24,
        "screen_height": 1080,
        "screen_width": 1920,
        "time_zone_offset": 300
  }
}
Respuestas

info
Nota: Para los métodos de pago que requieren redirección (como PSE o Bancolombia), la respuesta incluirá el objeto next_actions con la URL de redirección redirect_url. Para pagos con QR, se incluirá el qr_payload y su fecha de expiración por defecto de 10 minutos.

200: Respuesta exitosa.
Esquema: PaymentAttemptResponse
Content-Type: application/json
{
  "transaction_id": "TXN0987654321",
  "next_actions": { // Presente si existe una acción requerida para poder continuar con el pago como autenticación o validación de un tercero como 3DS
    "redirect_url": "https://mi-banco.com/pago-pse",
    "redirect_method": "POST"
  },
  "status": "RUNNING" // Estado actual de la transacción (siempre será RUNNING en esta respuesta).
}
info
Nota: Para renderizar el QR de tipo base64, debes renderizarlo en tu aplicación utilizando la siguiente estructura, reemplazando {qr_payload} por el valor recibido en la respuesta:

<img src="data:image/png;base64,{qr_payload}" alt="QR Bold" />
Controla el tamaño del QR utilizando CSS para asegurar una correcta visualización en tu aplicación.

warning
Para el QR de tipo texto plano “TEXT”, debes generar en tu propia integración el QR utilizando el valor recibido en qr_payload como el contenido del QR. Puedes usar cualquier librería de generación de QR compatible con tu stack tecnológico para esto y personalizarlo según tus necesidades sin cambios en el contenido del QR, ya que el valor de qr_payload es el que se utiliza para validar el pago cuando el cliente lo escanea. Asegúrate de mantener la integridad del valor recibido en qr_payload para garantizar que el proceso de pago funcione correctamente.

Errores

Esquema: Error
Content-Type: application/json
403: Acceso no permitido.
404: Not Found.
500: Error interno.
Validación 3D Secure (3DS)
Para cumplir con los más altos estándares de seguridad, todas las transacciones con tarjeta están sujetas a la posible autenticación 3D Secure (3DS). Tu integración siempre debe estar preparada para manejar este paso de verificación, ya que es un requisito fundamental en el flujo de pagos para garantizar la seguridad de la transacción.

Puedes consultar más detalles sobre la seguridad en nuestras transacciones aquí .

A continuación, se detalla el proceso que debes seguir.

Flujo de la transacción 3DS
Cuando un pago con tarjeta requiere la autenticación 3DS, la API te devolverá una respuesta específica para que puedas redirigir al usuario al sitio de autenticación del emisor de la tarjeta al realizar el llamado al Intento de Pago.

Respuesta para 3DS: Si la transacción requiere 3DS, la API responderá con un estado running y un objeto next_actions. Este objeto contiene la URL a la que debes redirigir al usuario para que complete el proceso de autenticación.

Ejemplo de respuesta:

{
  "payload": {
    "transaction_id": "CNXXXXXXXXX",
    "next_actions": {
      "redirect_method": "GET",
      "redirect_url": "https://3ds.url.co/3ds?id=KNXXXXXXXXX&merchantId=XXXXXXX&referenceId=your_reference&transactionId=CNXXXXXXXXX&network=VISA"
    },
    "status": "running",
    "status_detail": "processing",
    "uuid_token": "xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx"
  },
  "errors": []
}
Redirección del Usuario: Tu integración debe detectar la presencia del objeto next_actions y el estado running. En este caso, debes redirigir al usuario a la URL devuelta en redirect_url.

Autenticación y callback_url: Una vez que el usuario completa el proceso de autenticación 3DS (ingresando un código, aprobando desde su app bancaria, etc.), será redirigido de vuelta a tu sitio web a la callback_url que definiste al crear la intención de pago.

Verificación del Estado de la Transacción: Después de que el usuario regresa a tu URL enviada en el parámetro callback_url, debes realizar una consulta al endpoint Obtener el estado de un intento de pago para verificar el estado final de la transacción y así confirmar si el pago fue exitoso o no.

Pruebas de Estados 3DS y Motor de Fraude en Sandbox
Para facilitar las pruebas de tu integración en el ambiente de sandbox, puedes forzar diferentes escenarios de autenticación 3DS y respuestas del motor de fraude. Para lograrlo, simplemente utiliza los siguientes valores específicos en el campo total_amount al momento de realizar el intento de pago.

Cada monto simulará un resultado distinto:

Monto 555001: Simula una transacción Aprobada por 3DS ✅.
Monto 555002: Simula una transacción Rechazada por 3DS ❌.
Monto 555020: Simula un Challenge de 3DS. La respuesta de la API incluirá el objeto next_actions para que pruebes la redirección del usuario.
Monto 555040: Simula una transacción Aprobada por el motor de fraude sin requerir autenticación 3DS.
Monto 555042: Simula una transacción Rechazada por el motor de fraude.
Recuerda que estos montos solo activan los flujos simulados en el entorno de sandbox y no tendrán efecto en producción.

Obtener el estado de un intento de pago
Este endpoint te permite consultar el estado actual de un pago específico mediante su referencia única (reference_id). Proporciona información detallada sobre si el pago ha sido aprobado, rechazado o se encuentra en procesamiento, así como los detalles completos de la transacción.

Es complemento para actualizar tus sistemas internos y notificar al cliente sobre el resultado de su pago, recomendamos utilizarlo en conjunto con el webhook para recibir notificaciones en tiempo real.

Endpoint

GET /v1/payment/{reference_id} //Referencia de pago
Respuestas

200: Respuesta exitosa.
Esquema: PaymentAttemptStatusResponse
Content-Type: application/json
{
  "transaction_id": "TXN0987654321",
  "reference_id": "ORD-123456",
  "status": "APPROVED",
  "amount": {
    "currency": "COP",
    "total_amount": 100000,
    "tip_amount": 10000,
    "taxes": [
      {
        "type": "VAT",
        "base": 5000,
        "value": 500
      }
    ]
  },
  "payment_method": "CREDIT_CARD",
  "payer": {
    "person_type": "NATURAL_PERSON",
    "name": "Laura Gómez",
    "phone": "3001234567",
    "email": "laura.gomez@example.com",
    "document_type": "CEDULA",
    "document_number": "1012345678",
  },
  "attempt_date": "2025-02-17T17:43:17.531Z"
}
Errores

Esquema: Error
Content-Type: application/json
404: PaymentNotFound.
403: Acceso no permitido.
500: Error interno.
Obtener el listado de bancos disponibles para PSE
Este endpoint te permite consultar la lista de bancos disponibles para realizar pagos a través del método PSE (Pagos Seguros en Línea). Es útil para mostrar al cliente las opciones de bancos con los que puede realizar su pago.

Endpoint

GET /v1/payment/pse/banks
Respuestas

200: Respuesta exitosa.
Esquema: PSEBankListResponse
Content-Type: application/json
{
  "payload": {
    "banks": [
      {
        "bank_code": "1234",
        "bank_name": "BOLD CF"
      },
      {
        "bank_code": "1235",
        "bank_name": "BANCO 2"
      },
      {
        "bank_code": "2363",
        "bank_name": "BANCO 3"
      }
    ]
  }
}
Errores

Esquema: Error
Content-Type: application/json
403: Acceso no permitido.
500: Error interno.
Realizar una Anulación o Reembolso de un pago
Bold te permiten anular o reembolsar un pago previamente realizado. Es útil en situaciones donde necesitas revertir una transacción, ya sea por solicitud del cliente, error en el procesamiento o cualquier otra razón válida.

warning
Importante:
La anulación o reembolso solo se puede realizar si el medio de pago fue con tarjeta de crédito o débito y el pago se encuentra en estado “APPROVED”.
La anulación solo se puede realizar el mismo día de la transacción hasta antes de las 9 PM, de lo contrario debe realizarse como un reembolso.
Es una acción irreversible. Asegúrate de que realmente deseas realizar esta operación antes de proceder.
Realizar una anulación de un pago
Este endpoint te permite anular un pago previamente realizado. La anulación es una acción que revierte la transacción y se notifica al cliente que el pago ha sido cancelado el mismo día de la transacción.

Endpoint

POST /v1/payment/void
Solicitud

Datos necesarios para anular un pago.

Esquema: PaymentVoid

Content-Type: application/json

{
    "transaction_id":"TXN0987654321"
}
Respuestas

204: Respuesta exitosa sin cuerpo.
Errores

Esquema: Error
Content-Type: application/json
403: Acceso no permitido.
404: PaymentNotFound.
409: Conflicto al intentar anular un pago que no se puede cancelar.
500: Error interno.
Solicitar el reembolso de un pago
Este endpoint te permite solicitar un reembolso de un pago previamente realizado. A diferencia de la anulación, el reembolso se procesa como una acción por separado y puede realizarse en cualquier momento después de que el pago haya sido aprobado.

Este requiere un proceso de revisión y aprobación por parte de Bold, ya que implica devolver fondos al cliente y puede estar sujeto a políticas específicas de reembolso.

Endpoint

POST /v1/payment/refund
Solicitud

Datos necesarios para solicitar el reembolso.

Esquema: PaymentRefund

Content-Type: application/json

{
  "reference_id": "ORD-123456",
  "transaction_id": "TXN0987654321",
  "reason": "Error en el pago"
}
Respuestas

204: Respuesta exitosa sin cuerpo.
Errores

Esquema: Error
Content-Type: application/json
403: Acceso no permitido.
404: PaymentNotFound.
409: Conflicto al intentar solicitar el reembolso un pago.
500: Error interno.
Consultar el estado de un reembolso
Este endpoint te permite consultar el estado de un reembolso previamente solicitado. Es útil para verificar si el reembolso ha sido aprobado, rechazado o se encuentra en procesamiento.

Endpoint

GET /v1/payment/refund/{transaction_id}
Respuestas

200: Respuesta exitosa.
Esquema: PaymentRefundResponse
Content-Type: application/json
{
  "payload": {
    "transaction_id": "TXN0987654321",
    "status": "PROCESSING", // Estado del reembolso (PROCESSING, APPROVED, REJECTED)
    "date_applied": "2025-02-17T17:43:17.531Z"
  }
}
Errores

Esquema: Error
Content-Type: application/json
403: Acceso no permitido.
404: PaymentNotFound.
500: Error interno.
