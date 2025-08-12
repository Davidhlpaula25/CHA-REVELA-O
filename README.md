Convite Digital Interativo para Chá Revelação

Este é um projeto simples e personalizado para criar um convite digital interativo para um Chá Revelação. O convite foi desenvolvido em HTML, CSS e JavaScript, e utiliza o Firebase Realtime Database para gerenciar as confirmações de presença e a lista de presentes (fraldas).

Funcionalidades
-Convite Visualmente Atraente: Uma página única com a imagem do convite e informações sobre o evento.

-Confirmação de Presença: Um formulário que permite aos convidados confirmarem presença.

-Seleção de Presente: Os convidados podem selecionar o tamanho da fralda que levarão (M ou G).

-Link para Localização: Um botão intuitivo que, ao ser clicado, abre o endereço do evento no Google Maps.

-Painel de Administração: Uma área restrita por senha para o anfitrião visualizar em tempo real a lista de convidados, o total de  confirmações e a quantidade de fraldas de cada tamanho.

Estrutura do Projeto
O projeto é composto por dois arquivos HTML principais:

1- index.html: A página do convite que é enviada aos convidados. Contém o formulário de confirmação.

2- admin.html: O painel de controle, protegido por senha, para o anfitrião.

O código se conecta ao seu projeto no Firebase Realtime Database para salvar e ler os dados.

Como Configurar
1- Firebase: Crie um novo projeto no Firebase, ative o Realtime Database e configure as regras de segurança para permitir leitura e escrita em modo de teste.

2- Credenciais: Insira suas credenciais do Firebase (firebaseConfig) nos arquivos index.html e admin.html.

3- Senha de Admin: No arquivo admin.html, localize a variável ADMIN_PASSWORD e defina uma senha segura.

4- Imagem: Salve a imagem do seu convite no mesmo diretório dos arquivos HTML com o nome foto.png.

5- Pronto!: Você pode abrir o index.html em seu navegador para começar a enviar o convite.

Tecnologias Utilizadas

-HTML5: Estrutura da página.

-CSS3: Estilização e layout.

-JavaScript: Lógica de interação do formulário e conexão com o Firebase.

-Firebase Realtime Database: Banco de dados online para as confirmações.

-Font Awesome: Biblioteca de ícones (localização).
