window.MicFinderState.getAllMics().filter(m => m.venue && m.venue.toLowerCase().includes('producer')).map(m => ({venue: m.venue, id: m.id}))
