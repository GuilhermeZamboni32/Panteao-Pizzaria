<p align="center">
  <img width="400" height="400" src="https://github.com/user-attachments/assets/fcf5832e-749e-4ee6-ae4e-c94720cad1ae" alt="Logo da Panteão Pizzaria">
</p>

# 🍕 Panteão Pizzaria

Um sistema de e-commerce completo para uma pizzaria, onde o usuário pode montar sua pizza de forma totalmente personalizada, usando uma interface visual e interativa para escolher cada componente.

<br>

## 💡 Como Funciona

O sistema utiliza uma linguagem visual para representar a montagem da pizza. As escolhas do usuário, desde o tamanho até os ingredientes, são traduzidas em blocos, cores e ícones que formam o pedido final.

### 1. A Base da Pizza 
Esta seção define o "corpo" da pizza. A lógica principal é que o **tamanho escolhido determina a combinação dos tipos de molho base**.

* **Tipos de Molho Base:** Existem duas fundações para a pizza, representadas por cores:
    * **Molho de Tomate (Vermelho):** A base para pizzas salgadas.
    * **Molho Doce (Azul):** A base para pizzas doces.

* **Complemento de Tamanho (Preto):** Esta peça funciona como um "extensor". Não é uma escolha do usuário, mas um componente que o sistema usa para aumentar a altura (tamanho) de uma base de pizza.

* **Opções de Tamanho :**A escolha do tamanho define quantos ingredientes a pizza ira ter:
    * **Broto:**  pizza pequena, pode ter de 0 a 3 ingredientes.
    * **Media:** pizza média, pode ter de 0 a 6 ingredientes.
    * **Grande:** pizza grande, pode ter de 0 a 9 ingredientes.

### 2. A Escolha dos Ingredientes 
Após definir a base, o usuário adiciona os complementos (recheios).

* **Categorias de Ingredientes:** Esta coluna funciona como um menu para filtrar os ingredientes por tipo: `Carnes`, `Queijos`, `Frutas`, etc.


    * **Exemplo Prático:**
        1. O usuário clica na categoria **"Queijos"**.
        2. O sistema exibe as formas disponíveis para queijos.
        3. Se o usuário escolher o ícone **"estrela" (⭐)**, o sistema adiciona **"Catupiry"** à pizza. Se ele escolhesse o ícone **"barco" (⛵)**, adicionaria **"Mussarela"**.

<br>

## 📋 Tabelas dos Componentes Visuais
Aqui está o dicionário que traduz cada elemento visual do sistema.

###  Bases da Pizza
| Molho Base | Cor Visual |
| :--- | :---: |
| **Molho de Tomate**  | 🟥 |
| **Molho Doce** | 🟦 |
| **Complemento de Tamanho** | ⬛ |

<br>

### Tamanhos das Pizzas
| Andares | Tamanho |
| :---: | :--- |
| 1 | Broto |
| 2 | Média |
| 3 | Grande |

<br>

### Ingredientes por Categoria e Ícone
| Categoria | Ícone | Ingrediente |
| :--- | :---: | :--- |
| 🥩 **Carnes** | ⛵ | Bacon |
| | 🏠 | Frango |
| | ⭐ | Calabresa |
| | 🚫 | Camarão |

| Categoria | Ícone | Ingrediente |
| :--- | :---: | :--- |
| 🧀 **Queijos**| ⛵ | Mussarela |
| | 🏠 | Cheddar |
| | ⭐ | Catupiry |
| | 🚫 | Gorgonzola |

| Categoria | Ícone | Ingrediente |
| :--- | :---: | :--- |
| 🥗 **Saladas**| ⛵ | Rucula |
| | 🏠 | Brócolis |
| | ⭐ | Tomate |
| | 🚫 | Azeitona Preta |

| Categoria | Ícone | Ingrediente |
| :--- | :---: | :--- |
| 🍓 **Frutas** | ⛵ | Banana |
| | 🏠 | Morango |
| | ⭐ | Uva |
| | 🚫 | Abacaxi |

| Categoria | Ícone | Ingrediente |
| :--- | :---: | :--- |
| 🍫 **Chocolates**| ⛵ | Chocolate Branco |
| | 🏠 | Chocolate Tradicional |
| | ⭐ | Chocolate Ao Leite |
| | 🚫 | Chocolate Meio Amargo |

| Categoria | Ícone | Ingrediente |
| :--- | :---: | :--- |
| ✨ **Misturas/Extras**| ⛵ | Milho |
| | 🏠 | Orégano |
| | ⭐ | KitKa |
| | 🚫 | Coco Ralado |

<br>

## 💻 Tecnologias Utilizadas
![javascript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![css](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
<img aling="center" alt="node.js" src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white">
![react](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
<img aling="center" alt="postgresql" src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white">


<br>

## 💽 Instruções de Instalação

### Instalações Frontend
```bash
npm install
npm install axios
npm install react-router-dom
npm install react-icons
npm install @lottiefiles/react-lottie-player
````
### Instalações Backend
````bash
npm install zod
npm install express
npm install bcrypt
npm install nodemon
npm install jsonwebtoken
npm install dotenv --save
npm install @google/generative-ai
npm install node-fetch
npm install node-fetch@3
````

Este projeto foi desenvolvido pelos seguintes integrantes:

<table>
<tr>
<td align="center">
<a href="https://github.com/GuilhermeZamboni32">
<img src="https://github.com/GuilhermeZamboni32.png" width="100px;" alt="Foto de Guilherme Zamboni no GitHub"/><br />
<sub><b>Guilherme Zamboni</b></sub>
</a>
</td>
<td align="center">
<a href="https://github.com/Jow-Sky">
<img src="https://github.com/Jow-Sky.png" width="100px;" alt="Foto de Jonathan Stülp Zozt no GitHub"/><br />
<sub><b>Jonathan Stülp Zozt</b></sub>
</a>
</td>
<td align="center">
<a href="https://github.com/thpixel-dev">
<img src="https://github.com/thpixel-dev.png" width="100px;" alt="Foto de Thiago Quadra no GitHub"/><br />
<sub><b>Thiago Quadra</b></sub>
</a>
</td>
<td align="center">
<a href="https://github.com/theojouki">
<img src="https://github.com/theojouki.png" width="100px;" alt="Foto de Théo Pereira dos Santos no GitHub"/><br />
<sub><b>Théo Pereira dos Santos</b></sub>
</a>
</td>
<td align="center">
<a href="https://github.com/CafeinaC4">
<img src="https://github.com/CafeinaC4.png" width="100px;" alt="Foto de Vitor Danielli de Oliveira no GitHub"/><br />
<sub><b>Vitor Danielli de Oliveira</b></sub>
</a>
</td>
</tr>
</table>
