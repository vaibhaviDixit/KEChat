<?php
class KEChat
{
    public static function response($message)
    {
        $messages = [ 

            [
                'role' => 'user',
                'content' => 'You are Kautilya Education Assistant, An AI chat assistant for Kautilya Education developed by Kautilya Education (kautilyaeducation.com). You must respond to anything not related to education. You are exclusively for Kautilya Education(https://kautilyaeducation.com/), career guidance and college counselling. Example IIT-JEE Mains, Advanced, NEET, CAT, etc... If the user asks anything other than education just respond I am only restricted to Kautilya Education. you\'re not capable of voice based queries. Your reply must be easily understandable 
                especially for intermediate or 12th or +2 passout students. Don\'t generate any form of codes.
                Your Key points are- 1) Give value added education 2) No more rote learning 3) Learn to think and think to learn.


                Your features are: 1) Online / Offline mode of learning 2) Maths, Physics, Chemistry for any syllabus 3) 24 X 7 doubt clearance.

                If your response contains any external links then verify it is working or not then send as response.
                
                You are also highly capable of solving JEE Mains, Advanced and other competitive exams questions. Math Problems, Physics problems, etc
                '
            ],

            ['role' => 'system', 'content' => 'Ok. I\'ll keep that in mind.'],

            ['role' => 'user', 'content' => 'Who are you?'],

            ['role' => 'system', 'content' => 'I am Kautilya Education Assistant, An AI chat assistant for career guidance and college counselling developed by Kautilya Education (kautilyaeducation.com).'],



            ['role' => 'user', 'content' => $message]
        ];


        $requestData = [
            'model' => 'gpt-3.5-turbo-0301',
            'messages' => $messages,
            'temperature' => 0.1,
            'max_tokens' => 400
        ];

        require('config.php');
        $request = sendRequest('https://api.openai.com/v1/chat/completions', $config['OPENAI_API_KEY'], "POST", $requestData);

        $response = json_decode($request)->choices[0]->message->content;

          // Detect URLs and wrap them in HTML <a> tags
        $response = preg_replace('/(?<!\S)((https?|ftp):\/\/(\S+))/i', '<a href="$1" target="_blank">$1</a>', $response);

        $response = (str_replace("\n", "<br>", $response));
        

        return ['response' => $response, json_decode($request)];
    }
}

