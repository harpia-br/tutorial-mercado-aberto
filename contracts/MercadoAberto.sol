pragma solidity >=0.5.0 <0.7.0;

contract MercadoAberto {

	// Declaração do tipo enum
	enum Situacao { Disponivel, Travado, Vendido }
	// Total de produtos público
	uint public contagemDeProdutos = 0;

	// Declaração de um tipo complexo
	struct Produto {
		uint id; // identificação do produto
		string nome; // nome do produto
		uint preco; // preço do produto em Gas
		address payable vendedor; // endereço público do dono do produto
		Situacao situacao;
	}
	// a palavra chave payable permite ao contrato enviar Ether para essa conta

	struct Comprador {
		address payable conta;
	}

	// Mapeamento uma lista por id de produtos na váriavel 'produtos' e 'compradores' com acesso público
	mapping(uint => Produto) public produtos;
	mapping(uint => Comprador) public compradores;

	// Função para criar produtos
	function criarProduto(string memory nome, uint preco) public {
		// Requer um nome válido
		require(bytes(nome).length > 0);
		// Requer um preço válido
		require(preco > 0);
		// Incrementa o total de produtos
		contagemDeProdutos ++;
		// Criando um produto 
		// msg.sender é uma variável global do contrato com o endereço de quem está chamado esse contrato
		produtos[contagemDeProdutos] = Produto(contagemDeProdutos, nome, preco, msg.sender, Situacao.Disponivel);
	}

	function confirmarCompra(uint id) payable public {
		// Recuperando produto 
		// palavra chave memory, faz uso da memoria temporaria
		Produto memory produto = produtos[id];

		// validações
		// Validando se o produto é válido 
		require(produto.id > 0 && produto.id <= contagemDeProdutos);
		// Validando se tem Ether suficiente, nocaso vamos segurar o dobro do valor 
		// para garantir a entraega e confirmação
		require(msg.value >= (produto.preco * 2));
		// Validando se o produto não foi comprado 
		require(produto.situacao == Situacao.Disponivel);
		// Validando que o comprado não é o vendedor
		require(produto.vendedor != msg.sender);

		// alterando situacao 
		produto.situacao = Situacao.Travado;
		// alterando lista de produtos
		produtos[produto.id] = produto;
		// criando um comprador para esse produto enquanto em processo
		compradores[produto.id] = Comprador(msg.sender);
	}

	function cancelarCompra(uint id) payable public {
		Produto memory produto = produtos[id];
		require(produto.id > 0 && produto.id <= contagemDeProdutos);

		// somente o vendendor pode cancelar
		require(produto.vendedor == msg.sender);
		// produto travado
		require(produto.situacao == Situacao.Travado);

		// alterando situacao 
		produto.situacao = Situacao.Disponivel;
		// alterando lista de produtos
		produtos[produto.id] = produto;
	
		Comprador memory comprador = compradores[id];
		comprador.conta.transfer((produto.preco * 2));
	}

	function confirmarRecebimento(uint id) payable public {
		Produto memory produto = produtos[id];
		require(produto.id > 0 && produto.id <= contagemDeProdutos);
		Comprador memory comprador = compradores[id];
		
		// somente o comprador pode confirmar
		require(comprador.conta == msg.sender);
		// produto travado
		require(produto.situacao == Situacao.Travado);

		// alterando situacao 
		produto.situacao = Situacao.Vendido;
		// alterando lista de produtos
		produtos[produto.id] = produto;

		// tranferido  valor de compra ao vendedor
		// e deveolvendo o valor de seguro ao comprador
		comprador.conta.transfer(produto.preco);
		produto.vendedor.transfer(produto.preco);
	}

}
