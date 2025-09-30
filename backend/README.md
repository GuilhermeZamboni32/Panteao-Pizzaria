# Criação das tabelas no Banco de Dados

<br/>

````
-- Cria a extensão UUID se ela ainda não existir.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de clientes
CREATE TABLE clientes (
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
-- Tabela de pedidos (usando JSONB para manter a estrutura dos itens)
CREATE TABLE pedidos (
    pedido_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(cliente_id), 
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valor_total NUMERIC(10, 2) NOT NULL, 
    status VARCHAR(50) DEFAULT 'Recebido',
    itens JSONB NOT NULL -- guarda o array de pizzas como vem do frontend
);


-- Usuario para testes
INSERT INTO clientes (cliente_id, nome, email, senha) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Cliente Teste', 'teste@email.com', '123456');

````
<br/>
<br/>


