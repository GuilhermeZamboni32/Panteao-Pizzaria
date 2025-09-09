<p align="center">
  <img width="400" height="400" src="https://github.com/GuilhermeZamboni32/Panteao-Pizzaria/blob/main/Logo_Branco_1.png?raw=true" alt="Logo da Panteão Pizzaria">
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
    * **Media:** pizza pequena, pode ter de 0 a 6 ingredientes.
    * **Grande:** pizza pequena, pode ter de 0 a 9 ingredientes.

### 2. A Escolha dos Ingredientes 
Após definir a base, o usuário adiciona os complementos (recheios).

* **Categorias de Ingredientes:** Esta coluna funciona como um menu para filtrar os ingredientes por tipo: `Carnes`, `Queijos`, `Frutas`, etc.

* **Opções de Complementos (Sistema de Formas):** A grande inovação do sistema. O usuário não escolhe o ingrediente pelo nome, mas sim por uma **forma geométrica** associada a ele dentro da categoria selecionada.

    * **Exemplo Prático:**
        1. O usuário clica na categoria **"Queijos"**.
        2. O sistema exibe as formas disponíveis para queijos.
        3. Se o usuário escolher o ícone **"estrela" (⭐)**, o sistema adiciona **"Catupiry"** à pizza. Se ele escolhesse o ícone **"barco" (⛵)**, adicionaria **"Mussarela"**.

<br>

## 📋 Legenda dos Componentes Visuais
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
| 🧀 **Queijos**| ⛵ | Mussarela |
| | 🏠 | Cheddar |
| | ⭐ | Catupiry |
| | 🚫 | Gorgonzola |
| 🥗 **Saladas**| ⛵ | Alface |
| | 🏠 | Brócolis |
| | ⭐ | Tomate |
| | 🚫 | Gorgonzola |
| 🍓 **Frutas** | ⛵ | Banana |
| | 🏠 | Morango |
| | ⭐ | Uva |
| | 🚫 | Abacaxi |
| 🍫 **Chocolates**| ⛵ | Branco |
| | 🏠 | Preto |
| | ⭐ | Ao Leite |
| | 🚫 | Amargo |
| ✨ **Misturas/Extras**| ⛵ | Amendoim |
| | 🏠 | M&M |
| | ⭐ | Coco Ralado |
| | 🚫 | KitKat |

<br>

## 💻 Tecnologias Utilizadas
![javascript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![css](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![react](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![mongodb](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

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
````bash
npm install express
npm install bcrypt
npm install dotenv --save
npm install @google/generative-ai
pip install pymongo
pip install google-generativeai
pip install python-dotenv
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
