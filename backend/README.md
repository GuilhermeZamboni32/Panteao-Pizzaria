Instruções de istalação para os degenerados da minha equipe

1 - Instalar o python pelo site "https://www.python.org/downloads/" e pip pelo site "https://packaging.python.org/en/latest/tutorials/installing-packages/"


2 - criar um virtual environment
``` Bash
python -m venv venv
```

3 - Instalar as dependências
```Bash
pip install  -r requirements.txt
```

3.1 - Caso necessario atualizar as dependências
```Bash
pip freeze > requirements.txt #(após a atualização)
```