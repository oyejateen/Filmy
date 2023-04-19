const {Configuration, OpenAIApi} = require("openai");
const tmdb = require('tmdbv3').init(process.env.api);
const axios = require("axios");
const configuration = new Configuration({
  apiKey: process.env.token,
});
const openai = new OpenAIApi(configuration);

async function getMovieDetails(movieName) {

  const movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.api}&query=${movieName}`;
  const movieResponse = await axios.get(movieUrl);
  const movies = movieResponse.data.results;

  if (movies.length === 0) {
    throw new Error(`No movies found for summary "${movieName}"`);
  }

  const topMovieId = movies[0].id;
  const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${topMovieId}?api_key=${process.env.api}&language=en-US`;
  const movieDetailsResponse = await axios.get(movieDetailsUrl);
  const movieDetails = movieDetailsResponse.data;

  const message = `Based on your description, we recommend the movie:- \n\nTitle: "${movieDetails.title}" (${movieDetails.release_date.substring(0, 4)})\n\nSummary: ${movieDetails.overview}\n\nRating: ${movieDetails.vote_average} (${movieDetails.vote_count} votes)\n\n`;

  return message;
}


async function generateMovieRecommendation(description) {

  
  const openaiResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Please summarize the following movie description:\n\n${description}\n\nSummary:`,
    temperature: 0.5,
    max_tokens: 50,
    top_p: 1.0,
    frequency_penalty: 0.5,
    presence_penalty: 0.0,
    stop: "\n"
  });
  const summary = openaiResponse.data.choices[0].text.trim();
  //console.log(`\n\n`, summary)

  
  const identificationResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Please identify the name of the movie described below:\n\n${summary}\n\nMovie name:`,
    temperature: 0.5,
    max_tokens: 10,
    top_p: 1.0,
    frequency_penalty: 0.5,
    presence_penalty: 0.0,
    stop: "\n"
  });
  const movieName = identificationResponse.data.choices[0].text.trim();
 // console.log(`\n\n`, movieName)

  const message = await getMovieDetails(movieName);

  return message;
}


const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
console.clear();

  readline.question("Please provide a movie description: \n > ", async (description) => {
    readline.close();
    if(description.length === 0) {
      console.log("Bhai kuch to describe kerde yaar! Antaryaami thodi hu.")
    } else {
generateMovieRecommendation(description)
  .then(message => console.log(`\n\n\n`,message))
  .catch(error => console.error(error));
    }
    console.clear();
  });
