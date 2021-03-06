# Backend for supremarket

## Tech Stack

**Server:** Node, Express

**Database:** mySql
## Run Locally

Clone the project

```bash
  git clone https://github.com/Mohit2703/supermarket_backend.git
```

Go to the project directory

```bash
  cd supermarket_backend
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```




## API Reference

#### Add Product in Inventory, also generate Qr Code

```http
  POST /inventory/add
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `title` | `string` | **Required**. product title |
| `description` | `string` | product description |
| `sell_price` | `int` | **Required** selling price of product |
| `cost_price` | `int` | **Required** cost price of product |
| `quantity` | `int` | **Required** quantity of product want to add |
| `type` | `string` | **Required** type of product want to add |

#### Get All Products

```http
  GET /inventory/allProducts
```

#### Add exsisting product by product_id

```http
  GET /inventory/addexsisting/:id
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `quantity` | `int` | **Required**. quantity to be added |

#### Delete exsisting product by product_id

```http
  DELETE /inventory/deleteProduct/:id
```

#### Fetch product from Qr Code

```http
  GET /inventory/fetchProduct
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `qrcode` | `image(.png)` | **Required** |

#### Update product info

```http
  PUT /inventory/updateProduct/:product_id
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `title` | `string` | **Required**. product title |
| `description` | `string` | **Required** product description |
| `sell_price` | `int` | **Required** selling price of product |
| `cost_price` | `int` | **Required** cost price of product |
| `quantity` | `int` | **Required** quantity of product want to add |
| `type` | `string` | **Required** type of product want to add |

#### Make Cart

```http
  POST /cart/makeCart
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `products` | `array` | **Required** JSON contaning product_id and quantity as param |
| `user_id` | `int` | **Required** |

#### View Cart from Cart Id

 ```http
    GET /viewCart/3
 ```

 #### Get profit, sales of a date

 ```http
    GET /cart/getSales
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `date` | `string` | **Required** Date in the 'YYYY-MM-DD'|

 #### purchase of cart

 ```http
    POST /cart/checkout/:id
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `name` | `string` | **Required** Name of Customer|
| `phone` | `string` | **Required** Phone of Customer|

 #### Generate Invoice

 ```http
    GETT /cart/createInvoice/:id
```