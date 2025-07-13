import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Nav from "./components/Nav";
import AccountView from "./components/AccountView";
import LibraryView from "./components/LibraryView";
import WordBankView from "./components/WordBankView";
import ImportView from "./components/ImportView";
import GenerateView from "./components/GenerateView";
import LessonView from "./components/LessonView";
import EditView from "./components/EditView";
import Sidebar from "./components/Sidebar";
import AppContext from "./context/AppContext";
import { ApiManager } from "./api/apiManager";

function App() {
  const [state, setState] = useState({
    token: localStorage.getItem("token"),
    lessons: {
      "The Little Prince":
        "In the desert, I have learned to listen. All I needed was a little breeze to hear the voices of those I love. The stars whisper secrets to those who know how to listen. Each grain of sand holds a story waiting to be told.",
      "Morning Coffee":
        "The aroma of freshly ground coffee beans filled the small kitchen. Steam rose from the ceramic mug like tiny clouds ascending to heaven. Each sip was a moment of peace before the busy day began.",
      "Ocean Waves":
        "The waves crashed against the rocky shore with rhythmic persistence. Seagulls danced in the salty breeze while children built sandcastles that would soon be claimed by the tide. The ocean holds infinite mysteries beneath its surface.",
      "City Lights":
        "Neon signs flickered against the night sky, painting the wet streets in colorful reflections. Taxi cabs honked their way through the bustling traffic while people hurried home from late dinners and evening shows.",
      "Garden Stories":
        "Tomatoes ripened slowly in the summer heat while bees collected nectar from the lavender bushes. The old gardener smiled as he watered each plant with care, knowing that patience yields the sweetest harvest.",
      "Train Journey":
        "The locomotive whistle echoed through the valley as passengers settled into their seats with books and warm tea. Mountains passed by the window like ancient guardians watching over the winding tracks below.",
    },
    wordMetadata: {
      desert: { fam: "2" },
      learned: { fam: "known" },
      listen: { fam: "known" },
      breeze: { fam: "1" },
      voices: { fam: "known" },
      stars: { fam: "known" },
      whisper: { fam: "2" },
      secrets: { fam: "known" },
      aroma: { fam: "1" },
      freshly: { fam: "2" },
      ground: { fam: "known" },
      coffee: { fam: "known" },
      beans: { fam: "known" },
      kitchen: { fam: "known" },
      steam: { fam: "2" },
      ceramic: { fam: "1" },
      clouds: { fam: "known" },
      ascending: { fam: "1" },
      heaven: { fam: "known" },
      peace: { fam: "known" },
      waves: { fam: "known" },
      crashed: { fam: "2" },
      rocky: { fam: "known" },
      shore: { fam: "2" },
      rhythmic: { fam: "1" },
      persistence: { fam: "1" },
      seagulls: { fam: "2" },
      danced: { fam: "known" },
      salty: { fam: "known" },
      children: { fam: "known" },
      sandcastles: { fam: "2" },
      tide: { fam: "2" },
      ocean: { fam: "known" },
      infinite: { fam: "1" },
      mysteries: { fam: "2" },
      beneath: { fam: "2" },
      surface: { fam: "known" },
    },
    translationCache: {},
    deletedWords: [],
    filterValue: "all",
    currentText: "",
    editingKey: "",
    currentPage: 0,
    currentMode: "page",
    sidebarOpen: false,
    selectedWord: "",
    username: localStorage.getItem("username") || "",
  });

  useEffect(() => {
    if (state.token) {
      ApiManager.loadUserData(state, setState);
    }
  }, [state.token]);

  return (
    <AppContext.Provider value={{ state, setState }}>
      <Router>
        <div className="min-h-screen bg-background">
          <Nav />
          <main className="pt-16 pb-16">
            {" "}
            {/* Padding for fixed nav and bottom controls */}
            <Routes>
              <Route path="/account" element={<AccountView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/wordbank" element={<WordBankView />} />
              <Route path="/import" element={<ImportView />} />
              <Route path="/lesson/:key" element={<LessonView />} />
              <Route path="/edit/:key" element={<EditView />} />
              <Route
                path="/"
                element={
                  state.token ? (
                    <Navigate to="/library" />
                  ) : (
                    <Navigate to="/account" />
                  )
                }
              />
            </Routes>
          </main>
          <Sidebar />
        </div>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
