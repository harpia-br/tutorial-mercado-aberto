/* Biblioteca para criar nossos componentes */
import React from 'react';
/* Biblioteca para acessar contratos na rede Ethereum */
import Web3 from 'web3';
/* Importando o contrato */
import MercadoAberto from './abis/MercadoAberto.json'
/* Componentes para nossa aplicação web */
import {
	Table,
	Container,
	Form,
	Button,
	FormControl,
} from 'react-bootstrap'

/* Declaração do nosso componente */
class App extends React.Component {

	/* Alguns componentes React tem um 'estado', com dados, 
	 * para controlar a renderização do componente */
	state = {
		/* Variável para manejar o processamento dos dados */
		carregando: true,
		/* Variável para guardar a lista de tarefas dentro do contrato */
		produtos: [],
		/* Lista de compradores */
		compradores: [],
		/* Variável para guardar a conta que está selecionada no Metamask */
		conta: null,
		/* Variáveis para receber o nome e preço */
		nome: '',
		preco: 0,
		/* Variável para guardar o contrato que vamos utilizar */
		contrato: null,
	}

	/* Função que participa do ciclo de vida do componente com estado,
	 * ela é chamada quando o componente está montado, essa no caso é
	 * ideal para fazer solicitações assíncronas, palavra chave 'async' 
	 * facilita o trabalho com funções assíncronas, fazendo parte da ES7
	 * do JavaScript */
	async componentDidMount() {
		/* Todas as solicitações Web3 são assíncronas e o uso do ES7 async await
		 * ajuda muito a reduzir o código e facilita a manutenção */

		/* Criando uma instância do Web3 */
		let web3 = null
		/* Browser novos já tem acesso a rede Ethereum, como Mist ou Metamask */
		if(window.ethereum){
			web3 = new Web3(window.ethereum)
			await window.ethereum.enable()
		}else{
			/* Acessando a extensão de acesso a rede Ethereum */
			if(window.web3){
				web3 = new Web3(Web3.givenProvider)
			}else{
				alert('Ethereum browser não detectado! Tente usar o Metamask')
				return false
			}
		}

		/* Pega as contas que estão no caso no Metamask e traz a selecionada */
		const contas = await web3.eth.getAccounts()
		const conta = contas[0]
		/* Dados da rede que estamo conecta no caso a rede Ganache */
		const rede_id = await web3.eth.net.getId()
		const dadosRede = MercadoAberto.networks[rede_id]
		if(dadosRede){
			/* Pegando o contrato com o arquivo gerado pelo Truffle e o endereço da nossa rede */
			const contrato = new web3.eth.Contract(MercadoAberto.abi, dadosRede.address)
			/* buscando as tarefas dentro do contrato */
			const produtos = await this.buscarProdutos(contrato)
			/* A função setState() alterar o estado do objeto, quando o estado é diferente do atual 
			 * o algoritmo de reconciliciação do React avalia o que vai mudar na redenrização e altera
			 * apenas aquela informação, esse é o que faz O react tão diferente e poderoso */
			this.setState({
				carregando: false,
				produtos,
				contrato,
				conta,
			})

			/* Quando alterar uma conta no MetaMask mudar o estado */
			window.ethereum.on('accountsChanged', (accounts) => {
				this.setState({conta: accounts[0]})
			})

		}else{
			alert('Contrato não está implementado!')
		}
	}

	/* No React podemos controlar nosso formulário para não ter a necessidade de submeter o mesmo,
	 * além de poder filtrar os dados passado pela entrada de dados e quem altera o que é mostrado 
	 * é o algoritmo de reconciliação */
	alterarCampo = event => {
		/* Desestruturação do objeto para por os dados já em variáveis utilizad pelo ES6*/
		const {
			value,
			name,
		} = event.target
		this.setState({ [name]: value })
	}

	criarProduto = async () => {
		const {
			contrato,
			nome,
			preco,
			conta,
		} = this.state
		if(nome === ''){
			alert('Informe o nome')
			return false
		}
		if(preco === ''){
			alert('Informe o preço')
			return false
		}
		try{
			this.setState({carregando: true})
			/* Acesso aos métodos públicos do contrato, quando um método altera o estado
			 * do contrato usa-se o método 'send' com a conta do usuário selecionado 
			 * no Metamask além de usar 'Gas Fee', seria como a taxa de processamento,
			 * como por exemplo quando você faz uma compra na internet além do valor do
			 * produto paga-se a taxa de entrega que também é paga em valor por isso,
			 * na rede Ethereum a moeda é o Ether e o Gas seria uma fração de Ether,
			 * essa taxa é paga para quem faz o processamento, chamado de mineradores,
			 * ao chamar essa função um notificação do MetaMask mostra-rá os valores e
			 * se você aceita essa transação ou não */

			await contrato.methods.criarProduto(nome, preco).send({from: conta})
			/* Logo depois de criar uma nova tarefa, buscar as tarefas do contrao e
			 * submetido ao estado para que o React faça a alteração da renderização */
			const produtos = await this.buscarProdutos(contrato)
			this.setState({
				produtos,
				nome: '',
				preco: 0,
				carregando: false,
			})
		} catch (error) {
			/* Caso seja rejeitada a transação volta ao estado anterior */
			this.setState({
				carregando: false,
				nome: '',
				preco: 0,
			})
		}
	}

	buscarProdutos = async (contrato) => {
		/* Como buscar tarefas que estão nos contratos não alterar o estado do mesmo,
		 * então é usado a função 'call' */
		const contagemDeProdutos = await contrato.methods.contagemDeProdutos().call()
		const produtos = []
		for (let i = 1;i <= contagemDeProdutos ; i++) {
			produtos.push(await contrato.methods.produtos(i).call())
		}
		return produtos	
	}

	confirmarCompra = async (id) => {
		try{
			this.setState({carregando: true})
			let {
				produtos,
			} = this.state
			const {
				contrato,
				conta,
			} = this.state

			const produto = produtos.find(item => item.id === id)
			const valor = produto.preco * 2

			await contrato.methods.confirmarCompra(id).send({from: conta, value: valor})
			produtos = await this.buscarProdutos(contrato)
			this.setState({
				produtos,
				carregando: false,
			})
		} catch (error) {
			this.setState({
				carregando: false,
			})
		}

	}


	cancelarCompra = async (id) => {
		try{
			this.setState({carregando: true})
			const {
				contrato,
				conta,
			} = this.state

			await contrato.methods.cancelarCompra(id).send({from: conta, value: 0})
			const produtos = await this.buscarProdutos(contrato)
			this.setState({
				produtos,
				carregando: false,
			})
		} catch (error) {
			this.setState({
				carregando: false,
			})
		}
	}

	confirmarRecebimento = async (id) => {
		try{
			this.setState({carregando: true})
			const {
				contrato,
				conta,
			} = this.state


			await contrato.methods.confirmarRecebimento(id).send({from: conta, value: 0})
			const produtos = await this.buscarProdutos(contrato)
			this.setState({
				produtos,
				carregando: false,
			})
		} catch (error) {
			this.setState({
				carregando: false,
			})
		}
	}

	/* Função que informa ao React o que criar usando JSX, que facilita a criação
	 * de componentes que é justamente o uso de tags informa ao tradutor Babel para
	 * gerar um código Javascript ao executar a classe */
	render(){
		const {
			carregando,
			produtos,
			nome,
			preco,
			contrato,
			conta,
		} = this.state
		return (
			<Container
				style={{
					borderWidth: '.2rem .2rem 0',
					borderRadius: '8px 8px 0 0',
					sition: 'relative',
					padding: '1rem',
					border: '.2rem solid #ececec',
					color: '#212529',
					marginTop: 20,
				}}>
				<h1>Mercado Aberto </h1>
					{
						conta &&
							<h3>Conta: {conta}</h3>

					}
				{
					contrato && 
						!carregando && 
						<Form>
							<Form.Group>
								<Form.Label>Nome</Form.Label>
								<FormControl
									placeholder="Nome"
									id='nome'
									name='nome'
									value={nome}
									onChange={this.alterarCampo}
								/>
							</Form.Group>
							<Form.Group>
								<Form.Label>Preço</Form.Label>
								<FormControl
									placeholder="Preço"
									id='preco'
									name='preco'
									value={preco}
									onChange={this.alterarCampo}
								/>
							</Form.Group>
							<Button variant='primary' type='button' onClick={() => this.criarProduto()}>
								Criar
							</Button>
						</Form>
				}
				{
					carregando &&
						<h2>Carregando...</h2>
				}
				{
					!carregando &&
						produtos &&
						<>
						<h2>Lista de Produtos na Blockchain</h2>
						<Table striped bordered hover>
							<thead>
								<tr>
									<th>Produto</th>
									<th>Valor</th>
									<th>Situação</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{
									produtos.map(item => {
										let situacao = ''
										switch(parseInt(item.situacao)){
											case 1: situacao = 'Travado'; break;
											case 2: situacao = 'Vendido'; break;
											default: situacao = 'Disponivel';
										}
										return <tr key={item.id}>
											<td>{item.nome}</td>
											<td>{item.preco / 1000000000000000000} ETH</td>
											<td>{situacao}</td>
											<td>
												{
													conta &&
													parseInt(item.situacao) === 0 &&
														item.vendedor !== conta &&
														<Button variant='primary' type='button' 
															onClick={() => this.confirmarCompra(item.id)}>
															Confirmar Compra
														</Button>
												}
												{
													conta &&
													parseInt(item.situacao) === 1 &&
														item.vendedor === conta &&
														<Button variant='primary' type='button' 
															onClick={() => this.cancelarCompra(item.id)}>
															Cancelar Compra	
														</Button>
												}
												{
													parseInt(item.situacao) === 1 &&
														item.vendedor !== conta &&
														<Button variant='primary' type='button' 
															onClick={() => this.confirmarRecebimento(item.id)}>
															Confirmar Recebimento	
														</Button>
												}
												{
													parseInt(item.situacao) === 2 &&
														'Vendido'
												}
											</td>
										</tr>
									})
								}
							</tbody>
						</Table>
						</>
				}
			</Container>
		);
	}
}

export default App;
