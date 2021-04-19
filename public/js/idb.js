let db;

const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;

    db.createObjectStore('new_funds', { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadFunds();
    };
};

request.onerror = function (event) {
    console.log((event.target.errorCode));
};

// on attempt to submit transaction with no internet
function saveRecord(record) {
    const transaction = db.transaction(['new_funds'], 'readwrite');

    const fundsObjectStore = transaction.objectStore('new_funds');

    fundsObjectStore.add(record);

    alert('Transaction recorded! All transactions will be saved when an internet connection is reestablished.');
};

function uploadFunds() {
    const transaction = db.transaction(['new_funds'], 'readwrite');

    const fundsObjectStore = transaction.objectStore('new_funds');

    const getAll = fundsObjectStore.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            // might need /transaction/bulk?
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_funds'], 'readwrite');

                    const fundsObjectStore = transaction.objectStore('new_funds');

                    fundsObjectStore.clear();

                    alert('All saved transactions have been completed!');
                })
                .catch(err => {
                    console.log(err);
                })
        }
    }
};

window.addEventListener('online', uploadFunds);