import React, { useState, useEffect } from 'react';
import { Camera, MapPin, PlusCircle, Settings, List } from 'lucide-react';

const App = () => {
  const [currentPage, setCurrentPage] = useState('notes');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null); // Add this line
  const [installButtonVisible, setInstallButtonVisible] = useState(false); // Add this line

  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('notes');
    return savedNotes ? JSON.parse(savedNotes) : [];
  });

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  // Add this useEffect for PWA installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setInstallButtonVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setInstallPrompt(null);
    setInstallButtonVisible(false);
  };

  const NotesListPage = () => (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">My Notes</h1>
      <div className="grid gap-4">
        {notes.map((note) => (
          <div key={note.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold dark:text-white">{note.title}</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{note.content}</p>
            {note.image && (
              <img src={note.image} alt="Note" className="mt-2 rounded-lg w-full h-48 object-cover" />
            )}
            {note.location && (
              <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                <MapPin size={16} className="mr-1" />
                <span>{note.location}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const CreateNotePage = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState('');
    const [location, setLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleImageCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoElement = document.createElement('video');
        const canvasElement = document.createElement('canvas');
        
        videoElement.srcObject = stream;
        await videoElement.play();
        
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        
        canvasElement.getContext('2d').drawImage(videoElement, 0, 0);
        const imageData = canvasElement.toDataURL('image/jpeg');
        
        setImage(imageData);
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        alert('Camera access denied or not available');
      }
    };

    const handleGetLocation = () => {
      setIsLoading(true);
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
              );
              const data = await response.json();
              setLocation(data.display_name);
            } catch (error) {
              setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
            }
            setIsLoading(false);
          },
          (error) => {
            alert('Location access denied or not available');
            setIsLoading(false);
          }
        );
      } else {
        alert('Geolocation is not supported by your browser');
        setIsLoading(false);
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const newNote = {
        id: Date.now(),
        title,
        content,
        image,
        location,
        createdAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
      setTitle('');
      setContent('');
      setImage('');
      setLocation('');
      setCurrentPage('notes');
    };

    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">Create Note</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="w-full p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note Content"
            className="w-full p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white h-32"
            required
          />
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleImageCapture}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              <Camera size={20} />
              Add Photo
            </button>
            <button
              type="button"
              onClick={handleGetLocation}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              disabled={isLoading}
            >
              <MapPin size={20} />
              {isLoading ? 'Getting Location...' : 'Add Location'}
            </button>
          </div>

          {image && (
            <div className="mt-2">
              <img src={image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
            </div>
          )}
          
          {location && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MapPin size={16} />
              <span>{location}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 font-medium"
          >
            Save Note
          </button>
        </form>
      </div>
    );
  };

   const SettingsPage = () => {
    const handleShareClick = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "My Notes App",
            text: "Check out this awesome notes app!",
            url: window.location.href,
          });
          console.log("Shared successfully");
        } catch (error) {
          console.error("Error sharing:", error);
        }
      } else {
        alert("Web Share API is not supported in your browser.");
      }
    };
  
    return (
      <div className="p-6 min-h-screen">
        <h1 className="text-4xl font-bold text-center mb-8 dark:text-blue">
          Settings
        </h1>
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          {/* Image Section */}
          <div className="flex justify-center mb-6">
            <img
              src="/icon-192x192.png"
              alt="App Icon"
              className="w-44 h-44  "
            />
          </div>
  
          {/* Informational Text */}
          <h1 className="text-2xl text-center text-gray-600 dark:text-gray-300 mb-6">
            Customize your experience and share it with friends!
          </h1>
  
          {/* Buttons Section */}
          <div className="flex justify-between items-center mb-6 gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
            >
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>
  
            {installButtonVisible && (
              <button
                onClick={handleInstallClick}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
              >
                Install App
              </button>
            )}
  
            <button
              onClick={handleShareClick}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Share App
            </button>
          </div>
  
          {/* App Information Section */}
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              App Information
            </h2>
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Version:</span> 1.0.0
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Storage Used:</span>{" "}
                {(JSON.stringify(notes).length / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  

export default App;
