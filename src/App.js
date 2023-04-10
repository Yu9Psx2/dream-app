import React, { useState, useEffect } from 'react';
import { invokeLambdaFunction } from './lambdaFunctions';
import { useCookies } from 'react-cookie';
import { v4 as uuidv4 } from 'uuid';
import mj from './mj.gif';
import bog from './bog.gif';
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
  const [countdownTime, setCountdownTime] = useState(2); // Countdown time in seconds
  const [isCooldown, setIsCooldown] = useState(false);
  const [submitted_choice, setSubmittedChoice] = useState(false)
  const [chaosMode, setChaosMode] = useState(false);
  const [chaosModeUsed, setChaosModeUsed] = useState(false);
  const [chaosMarker, setChaosMarker] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [images] = useState([mj, bog]);
  const [randomImage, setRandomImage] = useState(images[Math.floor(Math.random() * images.length)]);

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

  useEffect(() => {
    if (chaosMarker === " introduce a sharknado into the story") {
      setBackgroundImage("https://picturebucket133234-dev.s3.amazonaws.com/shark.jpg");
    } else if (chaosMarker === " introduce a bear into the story") {
      setBackgroundImage("https://picturebucket133234-dev.s3.amazonaws.com/bear.jpg");
    } else if (chaosMarker === " have the protagonists find gold in the story") {
      setBackgroundImage("https://picturebucket133234-dev.s3.amazonaws.com/gold.jpg");
    } else {
      setBackgroundImage("");
    }
  }, [chaosMarker]);
  


  const handleChaosModeChange = (e) => {
    setChaosMode(e.target.checked);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setSubmitted(true);
    const passed_phrase = event.target.phrase.value;
    setGivenPhrase(passed_phrase)
    const payload = { phrase: passed_phrase };
    const lambdaResponse = await invokeLambdaFunction('dream_test', payload);

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

  const handleButtonClick = (phrase) => {
    const event = {
      preventDefault: () => { },
      target: { phrase: { value: phrase } },
    };
    handleFormSubmit(event);
  };

  const handleChoiceSubmit = async (choice) => {
    setRandomImage(images[Math.floor(Math.random() * images.length)])
    if (countdownTime >= 0) {
      setIsLoading(true);
      setIsCooldown(true);

      const payload = {
        phrase: given_phrase,
        story: {
          returned_messages: payload_holder.story.returned_messages,
          user_response: choice,
          returned_good_flag: payload_holder.story.returned_good_flag,
          returned_iterator: payload_holder.story.returned_iterator,
        },
        chaos_mode: chaosMode, // Add the chaos_mode flag
      };

      if (chaosMode) {
        // Disable the Chaos Mode checkbox if it was used
        setChaosMode(false);
        setChaosModeUsed(true);
      }

      const countdownInterval = setInterval(() => {
        setCountdownTime((prevTime) => prevTime - 1);
      }, 1000);

      const timer = setTimeout(async () => {
        clearInterval(countdownInterval);
        setCountdownTime(2);
        console.log("submitting request");
        setSubmittedChoice(true);
        const lambdaResponse = await invokeLambdaFunction("dream_test", payload);
        const payloadObject = JSON.parse(lambdaResponse["Payload"]);
        const chaos_marker = payloadObject["chaos_marker"];
        setChaosMarker(chaos_marker);
        setPayloadHolder(payloadObject);
        console.log(payloadObject);
        const returned_story = payloadObject["story"]["returned_messages"].slice(-1)[0].content;
        const returned_choices = payloadObject["story"]["returned_options"];
        console.log(returned_choices);
        setTheEnd(payloadObject["story"]["returned_end_flag"]);
        setStory(returned_story);
        setChoices(returned_choices);
        setIsLoading(false);
        setIsCooldown(false);
        setSubmittedChoice(false);
      }, countdownTime * 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
        setCountdownTime(2);
      };
    }
  };


  return (
    <div
    style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      width: "100%",
      minHeight: "100vh",
      overflow: "auto",
    }}
  >
    <>
    
      <Container fluid className="min-vh-100 d-flex justify-content-center align-items-center">
        <Stack gap={3} className="text-center d-flex justify-content-center">
          {isLoading ? (
            <>
              <div className="text-center mx-auto">
                <img src={randomImage} alt="MJ" style={{ width: 250, height: 250 }} />
              </div>
              <div>Loading, please wait...</div>
            </>
          ) : submitted ? (<>
            <div><img src={image.url} alt={'returned'} style={{ width: 768, height: 384 }} /></div>
            <div style = {{backgroundColor: "rgba(255, 255, 255, 0.8)"}}><p>{story}</p></div></>
          ) : (<>

            <Form onSubmit={handleFormSubmit}>
              <Form.Group controlId="formBasicEmail">
                <Form.Control type="text" name="phrase" placeholder="Enter phrase" />
              </Form.Group>
              <Button variant="primary" type="submit">
                Submit your phrase!
              </Button>
            </Form>
            <p style={{ fontSize: '1.5rem' }}>Or choose one of our selected prompts:</p>
            <Row>
              {[
                "A day in the life of a roof shingle",
                "A day in the life of an accountant at a fortune 500 company",
                "A day in the life of a giraffe at a zoo",
                "A day at the museum",
              ].map((phrase) => (
                <Col xs={6} md={3} key={phrase} className="mb-2">
                  <Button
                    onClick={() => handleButtonClick(phrase)}
                    style={{
                      width: "100%",
                      whiteSpace: "normal",
                      textAlign: "center",
                      wordWrap: "break-word",
                    }}
                  >
                    {phrase}
                  </Button>
                </Col>
              ))}
            </Row>
            <Row>
              {[
                "A day in the life of a French Bulldog",
                "A day in the life of a Shiba Inu",
                "A day in the life of a golden retriever",
                "A day in the life of a bullmastiff",
              ].map((phrase) => (
                <Col xs={6} md={3} key={phrase}>
                  <Button
                    onClick={() => handleButtonClick(phrase)}
                    style={{
                      width: "100%",
                      whiteSpace: "normal",
                      textAlign: "center",
                      wordWrap: "break-word",
                    }}
                  >
                    {phrase}
                  </Button>
                </Col>
              ))}
            </Row>

          </>
          )}
          {story && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%"
            }}>
              {Object.entries(choices).map(([choiceText, imageUrl], index) => (
                <div key={index} style={{
                  display: "flex",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "30%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)"
                }}>
                  <img src={imageUrl} alt={`${index}`} style={{ width: 250, height: 250 }} />
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <p style={{ wordWrap: "break-word" }}>{choiceText}</p>
                    <Button
                      onClick={() => handleChoiceSubmit(choiceText)}
                      disabled={isCooldown || submitted_choice}
                    >
                      {submitted_choice
                        ? "Request submitted"
                        : isCooldown
                          ? `On-cooldown, submitting in ${countdownTime}s`
                          : "Submit"
                      }
                    </Button>

                  </div>

                </div>

              ))}
                  {!chaosModeUsed && (
                <div>
                  <label htmlFor="chaosMode">Engage Chaos Mode</label>
                  <input
                    type="checkbox"
                    id="chaosMode"
                    name="chaosMode"
                    onChange={handleChaosModeChange}
                  />
                </div>
              )}
            </div>
          )}

          {the_end ? (<><div>THE END</div>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '10px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >Refresh the webpage</button>
          </>) : null}
        </Stack>
        {!submitted && (
          <div
            style={{
              position: "absolute",
              bottom: "5rem",
              textAlign: "center",
              width: "100%",
            }}
          >
            <div>
              If the story options get grouped together in one button, please refresh and
              re-enter your prompt
            </div>
            <div>
              I am currently trying to introduce more variables to the prompt with chaos mode - GPT may not respond with proper formatting.
            </div>
            <div>
              The story that is generated can be unpredictable, use at your own risk.
            </div>
            <div>
              The API responses are slow, please wait at least 30 seconds for a response.
            </div>
          </div>
        )}
      </Container>
    </></div>)
}

export default App;