import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const API_BASE_URL = "https://deckofcardsapi.com/api/deck";
const NO_CARDS_ERROR = "Error: no cards remaining!";

function App() {
  const deckIdRef = useRef(null);
  const [drawnCards, setDrawnCards] = useState([]);
  const [cardsRemaining, setCardsRemaining] = useState(52);
  const [loadingDeck, setLoadingDeck] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function createDeck() {
      setLoadingDeck(true);
      try {
        const res = await fetch(`${API_BASE_URL}/new/shuffle/?deck_count=1`);
        if (!res.ok) throw new Error("Deck request failed");
        const data = await res.json();
        if (!isCancelled) {
          deckIdRef.current = data.deck_id;
          setDrawnCards([]);
          setCardsRemaining(data.remaining ?? 52);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError("Could not load a new deck. Please refresh.");
        }
      } finally {
        if (!isCancelled) setLoadingDeck(false);
      }
    }

    createDeck();
    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleDrawCard() {
    if (!deckIdRef.current || isDrawing || isShuffling) return;
    setError(null);
    setIsDrawing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${deckIdRef.current}/draw/?count=1`);
      const data = await res.json();
      if (!res.ok || data.success === false || data.cards.length === 0) {
        throw new Error("no-cards");
      }

      const [card] = data.cards;
      setDrawnCards(cards => [
        ...cards,
        {
          code: card.code,
          image: card.image,
          label: `${card.value} of ${card.suit}`
        }
      ]);
      setCardsRemaining(data.remaining);
    } catch (err) {
      setError(err.message === "no-cards" ? NO_CARDS_ERROR : "Could not draw a card. Try again.");
    } finally {
      setIsDrawing(false);
    }
  }

  async function handleShuffleDeck() {
    if (!deckIdRef.current || isShuffling) return;
    setError(null);
    setIsShuffling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${deckIdRef.current}/shuffle/`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error("shuffle-failed");
      }
      setDrawnCards([]);
      setCardsRemaining(data.remaining);
    } catch (err) {
      setError("Shuffling failed. Please try again.");
    } finally {
      setIsShuffling(false);
    }
  }

  const isDeckReady = Boolean(deckIdRef.current) && !loadingDeck;

  return (
    <div className="App">
      <h1>Card Drawer</h1>
      <p className="App-subtitle">Click draw to reveal cards from a freshly shuffled deck.</p>

      <div className="App-controls">
        <button onClick={handleDrawCard} disabled={!isDeckReady || isDrawing || isShuffling}>
          {isDrawing ? "Drawing..." : "Draw Card"}
        </button>
        <button onClick={handleShuffleDeck} disabled={!isDeckReady || isShuffling}>
          {isShuffling ? "Shuffling..." : "Shuffle Deck"}
        </button>
      </div>

      <p className="App-remaining">Cards remaining: {cardsRemaining}</p>
      {error && (
        <p className="App-error" role="alert">
          {error}
        </p>
      )}

      {loadingDeck ? (
        <p>Loading deck...</p>
      ) : (
        <div className="App-card-area">
          {drawnCards.map(card => (
            <img key={card.code} src={card.image} alt={card.label} className="App-card" />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
