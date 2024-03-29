const API_ENDPOINT = 'https://kva-store.api.takoyaki3.com';

// Function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}

async function addMemo() {
  const tagsInput = document.getElementById('tag').value;
  const docBody = await encrypt(document.getElementById('docBody').value);
  if (docBody==null){
    return
  }
  console.log("data:",docBody)

  // Generate a random document ID on the client side
  const docId = generateUUID();

  // create a memo document
  const memoData = {
    body: docBody,
    createdAt: new Date().toISOString(),
  };

  // Save the document body
  await fetch(`${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authIdToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: docId,
        data: JSON.stringify(memoData) ,
        readable:loggedInUser.email }),
  });

  // Associate the document ID with each tag
  const tags = tagsInput.split(',');
  for (const tag of tags) {
      const trimmedTag = tag.trim();
      console.log(`Adding tag: ${trimmedTag} with doc ID: ${docId}`)
      await fetch(`${API_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authIdToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ key: trimmedTag, data: docId, readable:loggedInUser.email }),
      });
  }

  // clear the document body textarea
  document.getElementById('docBody').value = '';

  getByTag(memoData, docId);
}

async function getByTag(newMemoData = null, newDocId = null) {
  const tag = document.getElementById('tag').value;

  // If new memo data is passed, add it directly to the display area
  if (newMemoData && newDocId) {
    const docBody = await decrypt(newMemoData.body);

    const listItem = document.createElement('li');
    listItem.textContent = `${docBody}`;
    document.getElementById('memoList').prepend(listItem);
    return;
  }

  // Get the associated document IDs
  const response = await fetch(`${API_ENDPOINT}/?key=${tag}&limit=10`,{
    headers: {
      'Authorization': `Bearer ${authIdToken}`,
      'Content-Type': 'application/json'
    },
  });
  const docIds = await response.json();

  // Clear the list
  document.getElementById('memoList').innerHTML = "";

  // Fetch each document and display it
  for (let i=0;i<docIds.length;i++) {
      const docId = docIds[i].data;
      console.log(`${API_ENDPOINT}/?key=${docId}`)
      const response = await fetch(`${API_ENDPOINT}/?key=${docId}`,{
        headers: {
          'Authorization': `Bearer ${authIdToken}`,
          'Content-Type': 'application/json'
        },
      });
      const raw = await response.json();
      const data = JSON.parse(raw[0].data);
      const docBody = await decrypt(data.body);

      const listItem = document.createElement('li');
      listItem.textContent = `${docBody}`;
      document.getElementById('memoList').appendChild(listItem);
  }
}

document.addEventListener('keydown', function(event) {
  // 13 is the key code for the Enter key
  if (event.ctrlKey && event.keyCode === 13) {
    addMemo();
  }
});
