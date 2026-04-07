# Create a product
POST http://localhost:3000/products
Content-Type: application/json
{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "price": 2999,
    "image_url": "http://example.com/mouse.jpg"
}

HTTP 201
[Asserts]
jsonpath "$.id" exists
jsonpath "$.name" == "Wireless Mouse"
jsonpath "$.price" == 2999

[Captures]
product_id: jsonpath "$.id"

# Create a second product
POST http://localhost:3000/products
Content-Type: application/json
{
    "name": "USB Keyboard",
    "price": 7999
}

HTTP 201
[Asserts]
jsonpath "$.name" == "USB Keyboard"

# List all products
GET http://localhost:3000/products

HTTP 200
[Asserts]
jsonpath "$" exists

# Get product by ID
GET http://localhost:3000/products/{{product_id}}

HTTP 200
[Asserts]
jsonpath "$.name" == "Wireless Mouse"
jsonpath "$.price" == 2999

# Update product
PATCH http://localhost:3000/products/{{product_id}}
Content-Type: application/json
{
    "name": "Wireless Mouse V2",
    "price": 3499
}

HTTP 200
[Asserts]
jsonpath "$.name" == "Wireless Mouse V2"
jsonpath "$.price" == 3499

# Get updated product
GET http://localhost:3000/products/{{product_id}}

HTTP 200
[Asserts]
jsonpath "$.name" == "Wireless Mouse V2"

# Delete product
DELETE http://localhost:3000/products/{{product_id}}

HTTP 204  # considere mudar para 204

# Get deleted product should return 404
GET http://localhost:3000/products/{{product_id}}

HTTP 404
[Asserts]
jsonpath "$.message" == "Product not found"

# Create product with empty name should fail
POST http://localhost:3000/products
Content-Type: application/json
{ "name": "", "price": 1000 }

HTTP 400

# Create product without price should fail
POST http://localhost:3000/products
Content-Type: application/json
{ "name": "Free Item" }

HTTP 400
