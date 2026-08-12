document.querySelectorAll('.archive-item').forEach(item => {
  const title = item.querySelector('h2')?.textContent.trim() || 'Naujiena';
  const text = item.querySelector('p')?.textContent.trim() || '';
  const date = item.querySelector('time')?.textContent.trim() || '';
  const link = document.createElement('a');
  link.className = 'archive-read-more';
  link.textContent = 'Skaityti daugiau →';
  link.href = `naujienos-archyvas.html?title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}&date=${encodeURIComponent(date)}`;
  item.querySelector('div').append(link);
});
