# Contrato de la API — Semana 1
**Proyecto:** nestjs-productos-api
**Autor:** Alisson Basantes
**Versión del contrato:** 1.0
**Prefijo global:** /api/v1

---

## Recurso: Producto

Representación en JSON:

| Campo    | Tipo    | Obligatorio | Descripción                          |
|----------|---------|-------------|--------------------------------------|
| id       | integer | Sí          | Identificador único, mayor que cero  |
| nombre   | string  | Sí          | Nombre del producto, no vacío        |
| precio   | number  | Sí          | Precio en USD, decimal, 2 decimales  |

Ejemplo:

    { "id": 1, "nombre": "Teclado mecánico", "precio": 45.90 }

---

## Endpoint 1 — Listar productos

| Campo   | Valor               |
|---------|---------------------|
| Recurso | /api/v1/productos   |
| Verbo   | GET                 |
| Body    | No aplica           |

### Respuestas

| Código | Significado           | Cuerpo                                  |
|--------|-----------------------|-----------------------------------------|
| 200    | Consulta exitosa      | Arreglo de Producto (puede estar vacío) |
| 500    | Error del servidor    | Objeto de error                         |

Ejemplo de respuesta 200:

    [
      { "id": 1, "nombre": "Teclado mecánico", "precio": 45.90 },
      { "id": 2, "nombre": "Mouse inalámbrico", "precio": 19.50 }
    ]

Nota: una lista vacía es un resultado válido, responde 200 con `[]`.
No se usa 404 para una colección sin elementos.

---

## Endpoint 2 — Obtener un producto por id

| Campo     | Valor                                     |
|-----------|-------------------------------------------|
| Recurso   | /api/v1/productos/{id}                    |
| Verbo     | GET                                       |
| Parámetro | id (en la ruta), entero, obligatorio      |
| Body      | No aplica                                 |

### Respuestas

| Código | Significado                        | Cuerpo             |
|--------|------------------------------------|--------------------|
| 200    | Producto encontrado                | Un objeto Producto |
| 400    | El id no es un número entero       | Objeto de error    |
| 404    | No existe un producto con ese id   | Objeto de error    |
| 500    | Error del servidor                 | Objeto de error    |

Ejemplo de respuesta 200 (GET /api/v1/productos/1):

    { "id": 1, "nombre": "Teclado mecánico", "precio": 45.90 }

Ejemplo de respuesta 404 (GET /api/v1/productos/99):

    {
      "statusCode": 404,
      "message": "Producto con id 99 no encontrado",
      "error": "Not Found"
    }

Ejemplo de respuesta 400 (GET /api/v1/productos/abc):

    {
      "statusCode": 400,
      "message": "Validation failed (numeric string is expected)",
      "error": "Bad Request"
    }

---

## Formato de error

Todos los errores siguen la estructura por defecto de NestJS:

| Campo      | Tipo    | Descripción                        |
|------------|---------|------------------------------------|
| statusCode | integer | Código HTTP de la respuesta        |
| message    | string  | Descripción legible del problema   |
| error      | string  | Nombre corto del tipo de error     |

---

## Documentación

Swagger UI:      http://localhost:3000/api/docs
Documento JSON:  http://localhost:3000/api/docs-json