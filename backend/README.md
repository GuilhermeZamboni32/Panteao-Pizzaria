# Criação das tabelas no Banco de Dados

<br/>

````
-- Cria a extensão UUID se ela ainda não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--Tabela de Clientes --
CREATE TABLE clientes (
    cliente_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20)
);

-- Tabela de Pedidos --
CREATE TABLE pedidos (
    pedido_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id),
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valor_total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Recebido'
);

-- Tabela de Itens do Pedido --
CREATE TABLE itens_pedido (
    item_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pedido_id UUID NOT NULL REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
    nome_item VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    valor_unitario NUMERIC(10, 2) NOT NULL,
    valor_total NUMERIC(10, 2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED
);

-- Tabela de Endereços --
CREATE TABLE enderecos (
    endereco_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    rua VARCHAR(255) NOT NULL,
    numero VARCHAR(50) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    complemento VARCHAR(100)
);

-- Tabela de Cartões --
CREATE TABLE cartoes_salvos (
    cartao_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    gateway_token VARCHAR(255) NOT NULL, -- O 'tok_...' que o gateway (Stripe, etc.) lhe deu
    bandeira VARCHAR(50) NOT NULL,       -- Ex: "Visa"
    ultimos_4_digitos VARCHAR(4) NOT NULL ,-- Ex: "1S234"
    validade_cartao VARCHAR(7)
);

````







-- Adiciona a coluna para rastrear o status vindo da máquina
ALTER TABLE itens_pedido
ADD COLUMN status_maquina VARCHAR(50) DEFAULT 'Pendente';

-- Adiciona a coluna para salvar o slot de entrega (ex: "Slot:05")
ALTER TABLE itens_pedido
ADD COLUMN slot_entrega VARCHAR(50);

-- Adiciona a coluna para salvar o ID da máquina (ex: "maquina-xyz-123")
-- Isso é VITAL para ligar o webhook ao item correto.
ALTER TABLE itens_pedido
ADD COLUMN machine_id VARCHAR(100);

-- Opcional, mas recomendado para performance:
CREATE INDEX IF NOT EXISTS idx_machine_id ON itens_pedido (machine_id);


ALTER TABLE clientes ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;