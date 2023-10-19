import { useState, useRef, useEffect, useMemo, SetStateAction } from 'react'
import Head from 'next/head'
import styles from '../../styles/Home.module.css'
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import CircularProgress from '@mui/material/CircularProgress';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import remarkGfm from "remark-gfm";
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { translate } from '../../utils/translate';

type Message = {
  type: "apiMessage" | "userMessage";
  message: string;
  isStreaming?: boolean;
}

// TODOs:
// 1. Fetch the id from the url
// 2. Send it to the GET restraurants/{id} API to fetch restaurant detail
// 3. Set current restaurant state on the frontend. 
// 4. Send the id in the /chat API

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('ja');
  const [exampleMessages, setExampleMessages] =useState<string[]>([]);
  const [userInteracted, setUserInteracted] = useState(false);
  const changeLanguage = (selectedLanguage: SetStateAction<string>) => {
    setLanguage(selectedLanguage);
  };
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const router = useRouter();
  const { id } = router.query;
  // fetch restautant id and set state
  useEffect(() => {
    // Ensure id exists
    if (!id) return;
  
    const fetchRestaurantData = async () => {
      try {
        // just to test
        await new Promise(resolve => setTimeout(resolve, 500));
        // ------------

        const response = await fetch(`/api/restaurants/${id}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setRestaurant(data)
        setLoading(false);
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };
  
    fetchRestaurantData();
  }, [id]);

  // set initial message
  useEffect(() => {
    if (restaurant) {
      const greeting = translate('greeting', language)[0].replace('{restaurant_name}', restaurant.name)
       setMessageState(prevState => ({
          ...prevState,
          messages: [{
             "message": `${greeting}`,
             "type": "apiMessage"
          }]
       }));
    }
 }, [restaurant, language]);

 // handle example messages
 useEffect(() => {
  if (language) {
    setExampleMessages(translate('exampleMessages', language))
  }
 }, [language, exampleMessages])
//  const handleExampleMessageClick = (e: any) => {
//   // Trigger handleSubmit with the clicked example message
//   setUserInput(e.target.value)
//   handleSubmit(e, restaurant)

//   // Remove all example messages from the list
//   setExampleMessages([]);
//   setUserInteracted(true);
// };
 

  const [messageState, setMessageState] = useState<{ messages: Message[], pending?: string, history: [string, string][] }>({
    messages: [{
      "message": `Hi, I'm Umami, an AI assistant. How can I help you?`,
      "type": "apiMessage"
    }],
    history: []
  });
  const { messages, pending, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [pending]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current?.focus();
  }, [loading]);

  // Handle form submission
  const handleSubmit = async (e: any, restaurantData: Restaurant | null) => {
    e.preventDefault();

    // check for restaurant id
    if (!id) {
      console.error("Restaurant ID is not available yet.");
      return;
    }

    var question = userInput.trim();
    if (question === "") {
      return;
    }

    setMessageState(state => ({
      ...state,
      messages: [...state.messages, {
        type: "userMessage",
        message: question
      }],
      pending: undefined
    }));

    setLoading(true);
    setUserInput("");
    setMessageState(state => ({ ...state, pending: "" }));

    //Remove all example messages from the list
    setExampleMessages([]);
    setUserInteracted(true);
  
    var restaurantName = "";
    if (restaurantData) {
      restaurantName = restaurantData.name;
    }
    const ctrl = new AbortController();
    fetchEventSource('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        history,
        id,
        restaurantName,
        language,
      }),
      signal: ctrl.signal,
      onmessage: (event) => {
        if (event.data === "[DONE]") {
          setMessageState(state => ({
            history: [...state.history, [question, state.pending ?? ""]],
            messages: [...state.messages, {
              type: "apiMessage",
              message: state.pending ?? "",
            }],
            pending: undefined
          }));
          console.log("inside done")
          console.log(messages)
          setLoading(false);
          ctrl.abort();
        } else {
          console.log("inside else")
          console.log(messages)
          const data = JSON.parse(event.data);
          setMessageState(state => ({
            ...state,
            pending: (state.pending ?? "") + data.data,
          }));
        }
      }
    });
  }

  // Prevent blank submissions and allow for multiline input
  const handleEnter = async (e: any, restaurantData: Restaurant | null) => {
    if (e.key === "Enter" && userInput) {
      if(!e.shiftKey && userInput && restaurantData) {
        handleSubmit(e, restaurantData);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const chatMessages = useMemo(() => {
    return [...messages, ...(pending ? [{ type: "apiMessage", message: pending }] : [])];
  }, [messages, pending]);

  return (
    <>
      <Head>
        {/* <!-- Primary Meta Tags --> */}
        <title>Umami AI</title>
        <meta name="title" content="Umami AI: Ask away" />
        <meta name="description" content="Umami AI is the assistant every restaurant deserves." />

        {/* <!-- Open Graph / Facebook --> */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="UmamiAI: AI assistant every restaurant deserves." />
        <meta property="og:description" content="UmamiAI: AI assistant every restaurant deserves." />
        <meta property="og:image" content="../../public/favicon.png" />

        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className={styles.topnav}>
        <div>
          <Link href="/">
            <h1 className={styles.navlogo}>
            <Image src="/favicon.png" alt="AI" width="27" height="27"/>
              Umami
            </h1>
          </Link>
        </div>
        <div className = {styles.navlinks}>
          <Navbar language={language} onChangeLanguage={changeLanguage} />
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {chatMessages.map((message, index) => {
              let icon;
              let className;

              if (message.type === "apiMessage") {
                icon = <Image src="/favicon.png" alt="AI" width="30" height="30" className={styles.boticon} priority />;
                className = styles.apimessage;
              } else {
                icon = <Image src="/usericon.png" alt="Me" width="30" height="30" className={styles.usericon} priority />

                // The latest message sent by the user will be animated while waiting for a response
                className = loading && index === chatMessages.length - 1
                  ? styles.usermessagewaiting
                  : styles.usermessage;
              }
              return (
                  <div key={index} className={className}>
                    {icon}
                    <div className={styles.markdownanswer}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        linkTarget="_blank"
                      >
                        {message.message}
                      </ReactMarkdown>
                    </div>
                  </div>
              )
            })}
             {!userInteracted && (
              <div className={styles.exampleMessages}>
                {exampleMessages.map((message) => (
                  <button
                    key={message}
                    id="exampleMessage"
                    value={message}
                    onClick={e => handleSubmit(e, restaurant)}
                    className={styles.exampleMessage}
                  >
                    {message}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.center}>
          <div className={styles.cloudform}>
            <form onSubmit={e => handleSubmit(e, restaurant)}>
              <textarea 
                disabled={loading}
                onSubmit={e => handleEnter(e, restaurant)}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}
                id="userInput" 
                name="userInput" 
                placeholder={loading? "Waiting for response..." : `${translate('placeholder', language)[0]}`}  
                value={userInput} 
                onChange={e => setUserInput(e.target.value)} 
                className={styles.textarea}
              />
              <button 
                type="submit" 
                disabled = {loading}
                className = {styles.generatebutton}
              >
                {loading ? (
                  <div className={styles.loadingwheel}>
                    <CircularProgress color="inherit" size={20}/>
                  </div>
                ) : (
                  // Send icon SVG in input field
                  <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                    <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                  </svg>
                )}
              </button>
            </form>
          </div>
          <div className = {styles.footer}>
            <p>${translate('footer', language)[0]}</p>
          </div>
        </div>
      </main>
    </>
  )
}

interface Restaurant {
    id: string;
    name: string;
    filename: string;
  }

