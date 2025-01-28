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

   const SettingsPage = () => (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold dark:text-white">Dark Mode</h2>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
        
        {/* Add the install button here */}
        {installButtonVisible && (
          <div className="mb-4">
            <button
              onClick={handleInstallClick}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Install App
            </button>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-2 dark:text-white">App Information</h2>
        <p className="text-gray-600 dark:text-gray-300">Version: 1.0.0</p>
        <p className="text-gray-600 dark:text-gray-300">
          Storage Used: {(JSON.stringify(notes).length / 1024).toFixed(2)} KB
18 hours ago

Initial commit
        </p>
      </div>
9 hours ago
Initial commit
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'notes':
        return <NotesListPage />;
      case 'create':
        return <CreateNotePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <NotesListPage />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-2xl mx-auto pb-20">
        {renderCurrentPage()}
      </div>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg">
        <div className="max-w-2xl mx-auto flex justify-around p-4">
          <button 
            onClick={() => setCurrentPage('notes')} 
            className="flex flex-col items-center text-gray-600 dark:text-gray-300"
          >
            <List size={24} />
            <span className="text-sm mt-1">Notes</span>
          </button>
          <button 
            onClick={() => setCurrentPage('create')} 
            className="flex flex-col items-center text-gray-600 dark:text-gray-300"
          >
            <PlusCircle size={24} />
            <span className="text-sm mt-1">Create</span>
          </button>
          <button 
            onClick={() => setCurrentPage('settings')} 
            className="flex flex-col items-center text-gray-600 dark:text-gray-300"
          >
            <Settings size={24} />
            <span className="text-sm mt-1">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
