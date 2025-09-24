
-- Conecte-se ao seu banco de dados "Panteao_Pizzaria" antes de executar.
CREATE DATABASE IF NOT EXIST Panteao_Pizzaria

-- Cria a extensão UUID se ela ainda não existir.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria a tabela de usuários com os campos para teste.
CREATE TABLE Usuario (
    cliente_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    numero_cartao VARCHAR(20),   
    validade_cartao VARCHAR(7),  
    cvv VARCHAR(4)             
);

-- Cria a tabela de pizzas (pedidos)
CREATE TABLE Pizzas (
    id_pizza UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    ingredientes TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    imagem_url VARCHAR(255),
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
-- Chave estrangeira que se conecta à tabela Usuario
    cliente_id UUID NOT NULL,

-- Define a restrição da chave estrangeira
    CONSTRAINT fk_usuario
        FOREIGN KEY(cliente_id) 
        REFERENCES Usuario(cliente_id)
);









=================== TABELA PARA TESTE ================
