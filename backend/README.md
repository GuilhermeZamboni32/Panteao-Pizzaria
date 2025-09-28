# Criação das tabelas no Banco de Dados

<br/>

````
-- Cria a extensão UUID se ela ainda não existir.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    cliente_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco VARCHAR(255),
    numero_cartao VARCHAR(20),   
    validade_cartao VARCHAR(7),  
    cvv VARCHAR(4)             
);

-- Tabela de pizzas (pedidos)
CREATE TABLE IF NOT EXISTS Pizzas (
    id_pizza UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    ingredientes TEXT,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    cliente_id UUID NOT NULL,
    CONSTRAINT fk_clientes
        FOREIGN KEY(cliente_id) 
        REFERENCES clientes(cliente_id)
);


INSERT INTO clientes (cliente_id, nome, email, senha) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Cliente Teste', 'teste@email.com', '123456');

````
<br/>
<br/>




## backend
```
npm install node-fetch
npm install node-fetch@3
```
