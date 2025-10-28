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

ALTER TABLE clientes ALTER COLUMN cvv TYPE VARCHAR(255);
ALTER TABLE clientes ALTER COLUMN numero_cartao TYPE VARCHAR(255);

````
<br/>
<br/>


## nova tabela do BD
````
-- Cria a extensão UUID se ela ainda não existir.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- Tabela de Clientes ---
CREATE TABLE clientes (
    cliente_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco VARCHAR(255),
    -- Campos de cartão ajustados para armazenar o hash do bcrypt
    numero_cartao VARCHAR(255),
    validade_cartao VARCHAR(7),
    cvv VARCHAR(255)
);

-- --- Tabela de Pedidos ---
CREATE TABLE pedidos (
    pedido_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id),
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valor_total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Recebido',
    itens JSONB NOT NULL
);

-- --- Usuário para Testes ---
INSERT INTO clientes (cliente_id, nome, email, senha)
VALUES ('00000000-0000-0000-0000-000000000000', 'Cliente Teste', 'teste@email.com', '123456');

````



















-- Cria a extensão UUID se ela ainda não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- Tabela de Clientes ---
CREATE TABLE clientes (
    cliente_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco VARCHAR(255),
    -- Campos de cartão ajustados para armazenar o hash do bcrypt
    numero_cartao VARCHAR(255),
    validade_cartao VARCHAR(7),
    cvv VARCHAR(255)
);

-- --- Tabela de Pedidos ---
CREATE TABLE pedidos (
    pedido_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id),
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valor_total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Recebido'
);

-- --- Tabela de Itens do Pedido ---
CREATE TABLE itens_pedido (
    item_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pedido_id UUID NOT NULL REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
    nome_item VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    valor_unitario NUMERIC(10, 2) NOT NULL,
    valor_total NUMERIC(10, 2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED
);

-- --- Usuário para Testes ---
INSERT INTO clientes (cliente_id, nome, email, senha)
VALUES ('00000000-0000-0000-0000-000000000000', 'Cliente Teste', 'teste@email.com', '123456');
