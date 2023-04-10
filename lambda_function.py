import os
import os
import io
import warnings
from PIL import Image
from stability_sdk import client
import stability_sdk.interfaces.gooseai.generation.generation_pb2 as generation
import boto3
import logging
from chat_gpt_call import access_api
from call_stability import call_stability
import concurrent.futures
import time
from get_header import header_getter
import random

def lambda_handler(event, context):
    start_time = time.time()
    #Code is modified from dream studio example found at: https://platform.stability.ai/docs/getting-started/authentication
    return_dict = {"completion": False,
                "url": None,
                "message":None,
                }
    phrase = event['phrase']
    story = event.get('story',{})
    returned_options = {}

    #engage chaos mode
    phrase = event['phrase']
    chaos_mode = event.get('chaos_mode', False)
    if chaos_mode:
            random_events = [" introduce a sharknado into the story", " introduce a bear into the story", " have the protagonists find gold in the story"]
            chosen_event = random.choice(random_events)
            return_dict["chaos_marker"] = chosen_event  # Save the chaos marker to the response
    else:
        chosen_event = ""
     #access chat GPT to progress the story:
    
    returned_messages, returned_options, returned_iterator, returned_good_flag, returned_end_flag = access_api(prompt=event['phrase'], 
                                                                                                            messages=story.get("returned_messages",None),
                                                                                                            user_response = story.get("user_response", None), 
                                                                                                            good_flag = story.get("returned_good_flag", True), 
                                                                                                            iterator = story.get("returned_iterator",0),
                                                                                                            chaos_mode = chosen_event)
    print("this is length of returned options: ", len(returned_options))
    print(returned_options)
    return_dict['story'] = {"returned_messages":returned_messages, "returned_options":returned_options, "returned_iterator":returned_iterator, "returned_good_flag":returned_good_flag, "returned_end_flag":returned_end_flag}
    access_key=os.environ.get('REACT_APP_accessKeyId')
    secret_key=os.environ.get('REACT_APP_secretAccessKey')
    try:
        if return_dict['url'] == None:
            return_dict['url'] = header_getter(phrase)
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future_to_key = {executor.submit(call_stability, return_dict['story']['returned_messages'][-1]['content'], key): key for key in returned_options}
            for future in concurrent.futures.as_completed(future_to_key):
                key = future_to_key[future]
                try:
                    response = future.result()
                    if response["url"]:
                        returned_options[key] = response["url"]
                except Exception as e:
                    print(f"Error: {e}")
        end_time = time.time()
        elapsed_time = end_time - start_time
        return_dict["message"] = "Completed"
        return_dict["completion"] = "True"
        if elapsed_time < 2:
            time.sleep(2 - elapsed_time)
        return return_dict
    except Exception as e:
        return_dict["message"] = e
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(e)
        if elapsed_time < 2:
            time.sleep(2 - elapsed_time)
        return return_dict
