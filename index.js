/*
API Contract

- GET / User : Show all user

Response ; 
{
    "success": true,
    "data": [
        {
            "ID": 1,
            "Name": "Najmy",
            "address": "Sukabumi",
            "Balance": 20000,
            "expense": 5000
            
        }
    ]
}

- POST / Transaction :

Request :
{
    "type": "income",
    "amount": 5000,
    "user_id": 1
}

Response :
{
    "id": 1
}

- PUT / Transaction/:id :

Request :
{
    "type": "income",
    "amount": 5000,
    "user_id": 1
}

Response :
{
    "id": 1
}

- DELETE / Transaction/:id :

Response :
{
    "id": 1
}

*/

const express = require("express")
const mysql = require("mysql2")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")

dotenv.config()

const app = express()

const commonResponse = function (data, error) {
    if (error) {
       return { 
        error: error
       }
    }

    return {
        id: data
    }
}

const mysqlCont = mysql.createConnection({
    host: process.env.SQL_HOST,
    port: parseInt(process.env.SQL_PORT),
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE
})

const mysqlCont2 = mysql.createConnection(`${process.env.DB_LINK}`)

mysqlCont2.connect((err) => {
    if (err) throw err

    console.log("mysql successfully connected");
})

app.use(bodyParser.json())

app.get("/user", (request, response) => {
    
    mysqlCont2.query(
        "select * from user", (err, result, fields) => {
            if (err) {
                console.error(err)
                response.status(500).json(commonResponse(null, "response error"))
                response.end()
                return
            }
            console.log("user successfully connected", result);
            response.status(200).json(commonResponse(result, null))
            response.end()

            
        } 
    )
})

app.get("/user/:id", (request, response) => {
    
    mysqlCont2.query(
        `SELECT u.id, u.name, u.address,
        (SELECT sum(t.amount) - 
            (SELECT sum(t.amount) 
            FROM transaction t 
            WHERE t.type = "expense" and t.user_id = ${request.params.id} )
        FROM transaction t 
        WHERE t.type = "income" and t.user_id = ${request.params.id} ) as balance,
        
        (select sum(t.amount) 
            from transaction t 
            where t.type = "expense" and t.user_id = ${request.params.id} ) as expense
        from user as u, transaction as t
        WHERE u.id = ${request.params.id} 
        GROUP by u.id`, (err, result, fields) => {
            if (err) {
                console.error(err)
                response.status(500).json(commonResponse(null, "response error"))
                response.end()
                return
            }
            if(result){
                console.log("transaction successfully connected", result);
                response.status(200).json(commonResponse(result, null))
                response.end()
            } else {
                response.status(404).send("user id not found")
            }
        } 
    )
})

app.post("/transaction", (request, response) => {
    const {type, amount, user_id} = request.body
    console.log(request.body);
    
    mysqlCont2.query(
        `INSERT INTO transaction
        (user_id, type, amount)
        VALUES(${user_id}, "${type}", ${amount})`
        , (err, result, fields) => {
            if (err) {
                console.error(err)
                response.status(500).json(commonResponse(null, "response error"))
                response.end()
                return
            }
            console.log("transaction successfully connected", result);
            response.status(200).json(commonResponse(result.insertId, null))
            response.end()
        })
})

// app.post("/user", (request, response) => {
//     const {type, amount, user_id} = request.body
//     // const name: void
//     console.log(request.body);
    
//     mysqlCont2.query(
//         `INSERT INTO user
//         (name="${name}", address="${address}")
//         VALUES("${name}", "${address}")`, (err, result, fields) => {
//             if (err) {
//                 console.error(err)
//                 response.status(500).json(commonResponse(null, "response error"))
//                 response.end()
//                 return
//             }
//             console.log("transaction successfully connected", result);
//             response.status(200).json(commonResponse(result.insertId, null))
//             response.end()
//         })
// })

app.put("/transaction/:id", (request, response) => {
   const {type, amount, user_id} = request.body
   console.log(request.body)
   
   mysqlCont2.query(
    `UPDATE transaction
    SET user_id=${user_id}, type='${type}', amount=${amount}
    WHERE id=${request.params.id}`,
        (err, result, fields) => {
            if (err) {
                console.error(err)
                response.status(500).json(commonResponse(null, "response error"))
                response.end()
                return
            }
            if(result.affectedRows !== 0){
                console.log("transaction successfully connected", result);
                response.status(200).json(commonResponse((parseInt(request.params.id)), null))
                response.end()
            } else {
                response.status(404).send("transaction id not found")
            }
        }
   )
})

app.delete("/transaction/:id", (request, response) => {
   mysqlCont2.query(
    `DELETE FROM transaction
    WHERE id = ${request.params.id}`,
        (err, result, fields) => {
            if (err) {
                console.error(err)
                response.status(500).json(commonResponse(null, "response error"))
                response.end()
                return
            }
            if(result.affectedRows !== 0){
                console.log("transaction successfully connected", result);
                response.status(200).json(commonResponse((parseInt(request.params.id)), null))
                response.end()
            } else {
                response.status(404).send("transaction id not found")
            }

            
        }
   )
})


app.listen(4004, () => {
    console.log("running in port 4004")
})
