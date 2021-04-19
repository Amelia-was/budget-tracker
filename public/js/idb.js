// modal
let modal = document.querySelector('#modal');
let modalText = document.querySelector('#modalText');
let mask = document.querySelector('#mask');

function showModal(isOnline) {
    if (isOnline) {
        modalText.textContent = 'All saved transactions have been completed!';
    }
    else {
        modalText.textContent = 'Transaction recorded! All transactions will be saved when an internet connection is reestablished.';
    }
    modal.style.display = 'flex';
    mask.style.display = 'block';
}

function hideModal(e) {
    modal.style.display = 'none';
    mask.style.display = 'none';
};

mask.addEventListener('click', hideModal);

// indexed db
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

    showModal(false);
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

                    showModal(true);
                })
                .catch(err => {
                    console.log(err);
                })
        }
    }
};

window.addEventListener('online', uploadFunds);