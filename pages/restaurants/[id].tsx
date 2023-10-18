import { useState, useRef, useEffect, useMemo } from 'react'
import Head from 'next/head'
import styles from '../../styles/Home.module.css'
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import CircularProgress from '@mui/material/CircularProgress';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import remarkGfm from "remark-gfm";
import { useRouter } from 'next/router';

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
  const router = useRouter();
  const { id } = router.query;
  if (id) {
    console.log(id)
  }
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const [messageState, setMessageState] = useState<{ messages: Message[], pending?: string, history: [string, string][] }>({
    messages: [{
      "message": `Hi, I'm an Umami, an AI assistant for China Garden. How can I help you?`,
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
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const question = userInput.trim();
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

    const ctrl = new AbortController();

    fetchEventSource('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        history
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
          setLoading(false);
          ctrl.abort();
        } else {
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
  const handleEnter = (e: any) => {
    if (e.key === "Enter" && userInput) {
      if(!e.shiftKey && userInput) {
        handleSubmit(e);
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
        <title>Umami.ai</title>
        <meta name="title" content="Umami.ai: Ask away" />
        <meta name="description" content="Learn from one of the greatest thinkers of our time. Get access to Naval's wisdom and insights on wealth, happiness, and success." />

        {/* <!-- Open Graph / Facebook --> */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Almanac of Naval Ravikant: Chatbot" />
        <meta property="og:description" content="Learn from one of the greatest thinkers of our time. Get access to Naval's wisdom and insights on wealth, happiness, and success." />
        <meta property="og:image" content="https://navalmanac.progremir.dev/og-image.svg" />

        {/* <!-- Twitter --> */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Almanac of Naval Ravikant: Chatbot" />
        <meta property="twitter:description" content="Learn from one of the greatest thinkers of our time. Get access to Naval's wisdom and insights on wealth, happiness, and success." />
        <meta property="twitter:image" content="https://navalmanac.progremir.dev/og-image.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.topnav}>
        <div>
          <Link href="/"><h1 className={styles.navlogo}>Umami.ai</h1></Link>
        </div>
        <div className = {styles.navlinks}>
          <a
            href="https://www.navalmanack.com/"
            target="_blank"
            rel="noreferrer"
          >
            Book
          </a>
          <a
            href="https://github.com/progremir/navalmanac"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {chatMessages.map((message, index) => {
              let icon;
              let className;

              if (message.type === "apiMessage") {
                icon = <Image src="/chatIcon.png" alt="AI" width="30" height="30" className={styles.boticon} priority />;
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
          </div>
        </div>
        <div className={styles.center}>
          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <textarea 
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}
                id="userInput" 
                name="userInput" 
                placeholder={loading? "Waiting for response..." : "Type your question..."}  
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
            <p> Built by <a href="https://twitter.com/progremir" target="_blank" rel="noreferrer">
                Emir Amanbekov
              </a>. Not affiliated with <a href="https://www.navalmanack.com/" target="_blank" rel="noreferrer">
                Almanac of Naval Ravikant
              </a></p>
          </div>
        </div>
      </main>
    </>
  )
}

// export const getServerSideProps = (async (context) => {
//     const { id } = context.query;
//     const response = await fetch("api/restaurants/id");
//     const data = await response.json();
//     console.log("data", data);
      
//     return {
//       props: {
//         data,
//       },
//     };
//   })

interface Restaurant {
    id: string;
    name: string;
    filename: string;
  }

