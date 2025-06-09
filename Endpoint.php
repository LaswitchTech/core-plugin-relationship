<?php

/**
 * Core Framework - RelationshipEndpoint
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Endpoint;

class RelationshipEndpoint extends Endpoint {

    /**
     * Constructor
     */
    public function __construct()
    {

        // Call Parent Constructor
        parent::__construct();

        // Retrieve the namespace
        $namespace = $this->Request->getNamespace();

        // Set Global access
        $this->Public = false;

        // Set Level
        switch($namespace){
            case "/relationship/create":
                $this->Level = 2;
                break;
            case "/relationship/remove":
                $this->Level = 4;
                break;
        }
    }

    /**
     * Create a Relationship
     */
    public function createAction(): array
    {
        // Import Global Variables
        global $CSRF;

        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check the request method
        if($this->Request->getMethod() == "POST"){
            $message["data"]["CSRF"] = [
                "token" => $CSRF->token(),
                "key" => $CSRF->key()
            ];
        }

        // Check if the task is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Retrieve the parameters
                $parameters = $this->Request->getParams('REQUEST');

                // Set Required Fields
                $required = ['sourceTable','sourceId','targetTable','targetId'];

                // Check if all required fields are set
                if(count(array_intersect_key(array_flip($required), $parameters)) == count($required)){

                    // Sanitize the parameters
                    $parameters['sourceTable'] = htmlspecialchars($parameters['sourceTable']);
                    $parameters['sourceId'] = intval($parameters['sourceId']);
                    $parameters['targetTable'] = htmlspecialchars($parameters['targetTable']);
                    $parameters['targetId'] = intval($parameters['targetId']);

                    // Create the Relationship
                    $message['data']['data']['id'] = $this->Model->Relationship->create($parameters['sourceTable'], $parameters['sourceId'], $parameters['targetTable'], $parameters['targetId']);

                    // Set the message
                    $message['data']['data']['message'] = "Relationship created successfully";
                } else {
                    $message['status'] = 400;
                    $message['message'] = "Bad Request";
                    $message['data']['error'] = "Some required fields are missing [";
                    foreach($required as $key){
                        if(!array_key_exists($key, $parameters)){
                            $message['data']['error'] .= $key.", ";
                        }
                    }
                    $message['data']['error'] = rtrim($message['data']['error'], ", ");
                    $message['data']['error'] .= "]";
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }

        return $message;
    }

    public function removeAction(): array
    {
        // Import Global Variables
        global $CSRF;

        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check the request method
        if($this->Request->getMethod() == "POST"){
            $message["data"]["CSRF"] = [
                "token" => $CSRF->token(),
                "key" => $CSRF->key()
            ];
        }

        // Check if the task is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Retrieve the parameters
                $parameters = $this->Request->getParams('REQUEST');

                // Set Required Fields
                $required = ['sourceTable','sourceId','targetTable','targetId'];

                // Check if all required fields are set
                if(count(array_intersect_key(array_flip($required), $parameters)) == count($required)){

                    // Sanitize the parameters
                    $parameters['sourceTable'] = htmlspecialchars($parameters['sourceTable']);
                    $parameters['sourceId'] = intval($parameters['sourceId']);
                    $parameters['targetTable'] = htmlspecialchars($parameters['targetTable']);
                    $parameters['targetId'] = intval($parameters['targetId']);

                    // Remove the Relationship
                    $this->Model->Relationship->remove($parameters['sourceTable'], $parameters['sourceId'], $parameters['targetTable'], $parameters['targetId']);

                    // Set the message
                    $message['data']['data']['message'] = "Relationship removed successfully";
                } else {
                    $message['status'] = 400;
                    $message['message'] = "Bad Request";
                    $message['data']['error'] = "Some required fields are missing [";
                    foreach($required as $key){
                        if(!array_key_exists($key, $parameters)){
                            $message['data']['error'] .= $key.", ";
                        }
                    }
                    $message['data']['error'] = rtrim($message['data']['error'], ", ");
                    $message['data']['error'] .= "]";
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }

        return $message;
    }
}
