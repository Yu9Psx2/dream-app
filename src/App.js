import React, { useState } from 'react';
import AWS from 'aws-sdk';
import { invokeLambdaFunction } from './lambdaFunctions';


function App() {
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false)

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true)
    const passed_phrase = event.target.phrase.value;
    // const image = await getImageFromApi(phrase); // Your API implementation
    const payload = { phrase: passed_phrase };
    const lambdaResponse = await invokeLambdaFunction('dream_get', payload);

    const payloadObject = JSON.parse(lambdaResponse['Payload']);
    const returned_image = payloadObject['url'];
    setImageUrl(returned_image);
    setIsLoading(false)
  };

  return (
    <>
    <div>
      <form onSubmit={handleFormSubmit}>
        <label>
          Phrase:
          <input type="text" name="phrase" />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
    {isLoading ? (
        <div>Loading...</div>
      ) : imageUrl ? (
        <div>
          <img src={imageUrl} alt="API Image" />
        </div>
      ) : null}
  </>
  );
}

export default App;
