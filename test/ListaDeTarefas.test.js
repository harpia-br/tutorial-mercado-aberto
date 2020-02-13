const ListaDeTarefas = artifacts.require('./src/contract/ListaDeTarefas.sol');

contract('ListaDeTarefas', (contas) => {
	before(async () => {
		  this.listaDeTarefas = await ListaDeTarefas.deployed()
		 })

	 it('implementado com sucesso', async () => {
		  const endereco = this.listaDeTarefas.address
		  assert.notEqual(endereco, 0x0)
		  assert.notEqual(endereco, '')
		  assert.notEqual(endereco, null)
		  assert.notEqual(endereco, undefined)
		 })

	 it('Lista de tarefas', async () => {
		  const contagemDeTarefas = await this.listaDeTarefas.contagemDeTarefas()
		  const tarefaUm = await this.listaDeTarefas.tarefas(1)
		  assert.equal(tarefaUm.id.toNumber(), 1)
		  assert.equal(tarefaUm.conteudo, 'Acesse programadorblockchain.com.br')
		  assert.equal(tarefaUm.completada, false)
		  const tarefaDois = await this.listaDeTarefas.tarefas(2)
		  assert.equal(tarefaDois.id.toNumber(), 2)
		  assert.equal(tarefaDois.conteudo, 'Criar aplicação web para acessar nosso contrato')
		  assert.equal(tarefaDois.completada, false)
		  assert.equal(contagemDeTarefas.toNumber(), 2)
		 })

	it('Criar uma nova tarefa', async () => {
		  await this.listaDeTarefas.criarTarefa('Nova Tarefa')
		  const contagemDeTarefas = await this.listaDeTarefas.contagemDeTarefas()
		  assert.equal(contagemDeTarefas.toNumber(), 3)
		  const tarefaTres = await this.listaDeTarefas.tarefas(3)
		  assert.equal(tarefaTres.id.toNumber(), 3)
		  assert.equal(tarefaTres.conteudo, 'Nova Tarefa')
		  assert.equal(tarefaTres.completada, false)
		 })

	 it('Alternar tarefa completada', async () => {
		  await this.listaDeTarefas.alternarCompletada(1)
		  const tarefaUm = await this.listaDeTarefas.tarefas(1)
		  assert.equal(tarefaUm.completada, true)
		 })
})
