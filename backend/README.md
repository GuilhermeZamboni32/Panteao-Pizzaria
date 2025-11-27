# Criação das tabelas no Banco de Dados

<br/>

```
-- Cria a extensão UUID se ela ainda não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Clientes (Com is_admin já incluso)
CREATE TABLE clientes (
    cliente_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    is_admin BOOLEAN DEFAULT FALSE -- Movido do ALTER TABLE para cá
);

-- 2. Tabela de Pedidos (Com slot_entrega já incluso)
CREATE TABLE pedidos (
    pedido_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id),
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valor_total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Recebido',
    slot_entrega VARCHAR(50) -- Movido do ALTER TABLE para cá (opcional para histórico)
);

-- 3. Tabela de Itens do Pedido (Completa com campos da Máquina)
CREATE TABLE itens_pedido (
    item_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pedido_id UUID NOT NULL REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
    nome_item VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    valor_unitario NUMERIC(10, 2) NOT NULL,
    valor_total NUMERIC(10, 2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    
    -- Campos adicionados para controle da Máquina/Esteira
    status_maquina VARCHAR(50) DEFAULT 'Pendente', -- Status individual do item
    slot_entrega VARCHAR(50),                      -- Ex: "Slot:05"
    machine_id VARCHAR(100)                        -- ID único vindo do hardware/middleware
);

-- Índice para melhorar a performance das buscas pelo Webhook e Rota de Status
CREATE INDEX IF NOT EXISTS idx_machine_id ON itens_pedido (machine_id);

-- 4. Tabela de Endereços
CREATE TABLE enderecos (
    endereco_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    rua VARCHAR(255) NOT NULL,
    numero VARCHAR(50) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    complemento VARCHAR(100)
);

-- 5. Tabela de Cartões
CREATE TABLE cartoes_salvos (
    cartao_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    gateway_token VARCHAR(255) NOT NULL, 
    bandeira VARCHAR(50) NOT NULL,       
    ultimos_4_digitos VARCHAR(4) NOT NULL,
    validade_cartao VARCHAR(7)
);
```