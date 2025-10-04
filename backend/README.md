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
-- Armazena todos os dados dos usuários cadastrados.
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
-- Armazena o histórico de pedidos de cada cliente.
CREATE TABLE pedidos (
    pedido_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- Chave estrangeira que cria a ligação com a tabela 'clientes'
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id), 
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valor_total NUMERIC(10, 2) NOT NULL, 
    status VARCHAR(50) DEFAULT 'Recebido',
    -- O array completo de itens do pedido é guardado aqui
    itens JSONB NOT NULL 
);

-- --- Usuário para Testes ---
-- Insere um usuário padrão para facilitar o desenvolvimento.
-- ATENÇÃO: A senha '123456' está em texto plano. No seu sistema, ela será salva
-- com hash pelo bcrypt na rota de cadastro.
INSERT INTO clientes (cliente_id, nome, email, senha) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Cliente Teste', 'teste@email.com', '123456');

````