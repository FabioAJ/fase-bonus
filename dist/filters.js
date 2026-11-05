(function (root) {
  const states = [
    ['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],
    ['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],
    ['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],
    ['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],
    ['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],
    ['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],
    ['SE','Sergipe'],['TO','Tocantins']
  ];
  function matchesState(application, uf) {
    return !uf || application.territoryScope === 'national' ||
      (application.territoryScope === 'restricted' && application.states.includes(uf));
  }
  function matchesCnpj(application, value) {
    return !value || (value === 'yes' && application.requiresCnpjAtApplication === true) ||
      (value === 'no' && application.requiresCnpjAtApplication === false);
  }
  const filters = {states, matchesState, matchesCnpj};
  if (typeof module !== 'undefined' && module.exports) module.exports = filters;
  else root.RADAR_FILTERS = filters;
})(typeof window !== 'undefined' ? window : globalThis);
