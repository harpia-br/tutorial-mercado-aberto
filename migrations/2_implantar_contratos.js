const MercadoAberto = artifacts.require('./MercadoAberto.sol');

module.exports = function(implatador) {
	 implatador.deploy(MercadoAberto);
};
