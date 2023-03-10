import React, { useState, useEffect } from 'react';
import { invokeLambdaFunction } from './lambdaFunctions';
import { useCookies } from 'react-cookie';
import { v4 as uuidv4 } from 'uuid';
import mj from './mj.gif';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Navbar from 'react-bootstrap/Navbar';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import './App.css';
import mockApiResponse from './mockAPI.js';
import mockApiResponse2 from './mockAPI2.js';

function App() {
  const [story, setStory] = useState('');
  const [choices, setChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cookies, setCookie] = useCookies(['id']);
  const oneDay = 60 * 60 * 24; // 1 day in seconds
  const [submitted, setSubmitted] = useState(false);
  const [payload_holder, setPayloadHolder] = useState(null)
  const [given_phrase, setGivenPhrase] = useState(null)
  const [image, setImage] = useState('')
  const [the_end, setTheEnd] = useState(null)

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
    setIsLoading(true);
    setSubmitted(true);
    const passed_phrase = event.target.phrase.value;
    setGivenPhrase(passed_phrase)
    const payload = { phrase: passed_phrase };
    const lambdaResponse = await invokeLambdaFunction('dream_get', payload);
   
    const payloadObject = JSON.parse(lambdaResponse['Payload']);
    setPayloadHolder(payloadObject)
    console.log(payloadObject)
    const returned_story = payloadObject['story']['returned_messages'].slice(-1)[0].content;
    console.log(payloadObject)
    const returned_choices = payloadObject['story']['returned_options'];
    const returned_image = payloadObject['url']
    setImage(returned_image)
    // const returned_choices = mockApiResponse
    setStory(returned_story);
    setChoices(returned_choices);
    setIsLoading(false);
  };

  const handleChoiceSubmit = async (choiceIndex) => {
    setIsLoading(true);
    const choice = choices[choiceIndex];
    const payload = { phrase: given_phrase,
      story: {returned_messages:payload_holder.story.returned_messages,
      user_response:choice[0],
      returned_good_flag: payload_holder.story.returned_good_flag,
      returned_iterator:payload_holder.story.returned_iterator,
     }};
    const lambdaResponse = await invokeLambdaFunction('dream_get', payload);
    const payloadObject = JSON.parse(lambdaResponse['Payload']);
    setPayloadHolder(payloadObject)
    console.log(payloadObject)
    const returned_story = payloadObject['story']['returned_messages'].slice(-1)[0].content;
    const returned_choices = payloadObject['story']['returned_options'];
    // const returned_choices = mockApiResponse2
    setTheEnd(payloadObject['story']['returned_end_flag'])
    setStory(returned_story);
    setChoices(returned_choices);
    setIsLoading(false);
  };

  return (
    <>
      <Container fluid className="min-vh-100 d-flex justify-content-center align-items-center">
        <Stack gap={3} className="text-center d-flex justify-content-center">
          {isLoading ? (
            <>
              <div className="text-center mx-auto">
                <img src={mj} alt="MJ" style={{ width: 250, height: 250 }} />
              </div>
              <div>Loading, please wait...</div>
            </>
          ) : submitted ? (<>
            <div><img src={image} alt={`returned`} style={{ width: 250, height: 250 }} /></div>
            <div><p>{story}</p></div></>
          ) : (
            <Form onSubmit={handleFormSubmit}>
              <Form.Group controlId="formBasicEmail">
                <Form.Control type="text" name="phrase" placeholder="Enter phrase" />
              </Form.Group>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Form>
          )}
          {story && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              {choices.map((choice, index) => (
                <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <img src={choice.url} alt={`${index}`} style={{ width: 250, height: 250 }} />
                  <p>{choice}</p>
                  <Button onClick={() => handleChoiceSubmit(index)}>Submit</Button>
                </div>
              ))}
            </div>
          )}
          {the_end ? (<><div>THE END</div></>): null}
        </Stack>
      </Container>
      </>)
}

export default App;