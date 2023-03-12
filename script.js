const pokeballButton = document.getElementById('pokeball')
const pokemonInfo = document.getElementById('pokemon-info')

pokeballButton.addEventListener('click', async () => {
  try {
    const randomPokemonId = Math.floor(Math.random() * 898) + 1 // There are currently 898 Pokemon in the PokeAPI
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${randomPokemonId}`
    )
    const data = await response.json()

    const abilities = data.abilities
      .map(ability => ability.ability.name)
      .join(', ') // Get all the abilities and join them with a comma

    pokemonInfo.innerHTML = `
      <p>Name: ${data.name}</p>
      <p>Height: ${data.height}</p>
      <p>Weight: ${data.weight}</p>
      <p>Ability: ${abilities}</p>

      <img src="${data.sprites.front_default}" alt="${data.name}">
    `
  } catch (error) {
    console.error(error)
  }
})
