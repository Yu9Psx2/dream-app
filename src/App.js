import React, { useState, useEffect } from 'react';
import { invokeLambdaFunction } from './lambdaFunctions';
import { useCookies } from 'react-cookie';
import { v4 as uuidv4 } from 'uuid';


function App() {
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false)
  const [cookies, setCookie] = useCookies(['id']);
  const oneDay = 60 * 60 * 24; // 1 day in seconds


  useEffect(() => {
    // Check if the cookie exists
    if (!cookies.id) {
      // If the cookie doesn't exist, generate a new user ID and set the cookie
      const userId = uuidv4();
      setCookie('id', userId, { expires: new Date(Date.now() + oneDay) });
    } else {
      // If the cookie exists, retrieve the user ID from the cookie and use it in your application
      const userId = cookies.id;
      console.log('User ID:', userId);
    }
  }, [cookies, setCookie]);


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
    <div>This site uses cookies to track your progress.</div>
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
