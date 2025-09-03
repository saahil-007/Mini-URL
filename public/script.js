
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const urlInput = document.getElementById('urlInput');
    const shortenBtn = document.getElementById('shortenBtn');
    const resultDiv = document.querySelector('.result');
    const shortUrlLink = document.getElementById('shortUrl');
    const copyBtn = document.getElementById('copyBtn');
    const qrCodeDiv = document.getElementById('qrcode');
    const recentUrlsTableBody = document.querySelector('#url-table tbody');
    const loader = document.querySelector('.loader');
    const errorContainer = document.querySelector('.error-container');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    let qrcode = new QRCode(qrCodeDiv, {
        width: 128,
        height: 128
    });

    const apiBaseUrl = window.location.origin;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIconLight.style.display = 'none';
            themeIconDark.style.display = 'block';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeIconLight.style.display = 'block';
            themeIconDark.style.display = 'none';
        }
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    themeToggleButton.addEventListener('click', toggleTheme);

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    const displayError = (message) => {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    };

    const clearError = () => {
        errorContainer.textContent = '';
        errorContainer.style.display = 'none';
    };

    const validateUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    };

    const shortenUrl = async () => {
        clearError();
        const longUrl = urlInput.value.trim();

        if (!longUrl || !validateUrl(longUrl)) {
            displayError('Please enter a valid URL.');
            return;
        }

        loader.style.display = 'block';
        resultDiv.style.display = 'none';
        qrCodeDiv.style.display = 'none';

        try {
            const response = await fetch(`${apiBaseUrl}/api/shorten`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ long_url: longUrl }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to shorten URL.');
            }

            const data = await response.json();
            const shortUrl = `${apiBaseUrl}/${data.short_code}`;

            shortUrlLink.href = shortUrl;
            shortUrlLink.textContent = shortUrl;
            resultDiv.style.display = 'flex';

            qrcode.makeCode(shortUrl);
            qrCodeDiv.style.display = 'block';

            urlInput.value = '';
            fetchRecentUrls(true);

        } catch (error) {
            displayError(error.message);
        } finally {
            loader.style.display = 'none';
        }
    };

    const copyToClipboard = (text, btn) => {
        navigator.clipboard.writeText(text).then(() => {
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            } else {
                alert('URL copied to clipboard!');
            }
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy URL.');
        });
    };

    const truncateUrl = (url, maxLength = 30) => {
        if (url.length <= maxLength) {
            return url;
        }
        return url.substring(0, maxLength) + '...';
    };

    const fetchSiteInfo = async (url) => {
        try {
            const response = await fetch(`${apiBaseUrl}/site-info?url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch site info');
            }
            const data = await response.json();
            return {
                title: data.title || '',
                favicon: data.favicon || ''
            };
        } catch (error) {
            console.error('Error fetching site info:', error);
            return {
                title: '',
                favicon: ''
            };
        }
    };

    const fetchRecentUrls = async () => {
    const recentUrlsTableBody = document.querySelector('#url-table tbody');
    recentUrlsTableBody.innerHTML = ''; // Clear existing rows

    try {
        const response = await fetch(`${apiBaseUrl}/recent?all=true`);
        if (!response.ok) {
            throw new Error('Could not fetch recent URLs.');
        }
        const data = await response.json();
        const { rows: urls } = data;

        if (urls.length === 0) {
            loadMoreBtn.style.display = 'none';
            return;
        }

        const siteInfoPromises = urls.map(url => fetchSiteInfo(url.long_url));
        const siteInfos = await Promise.all(siteInfoPromises);

        let tableContent = '';
        urls.forEach((url, index) => {
            const shortUrl = `${apiBaseUrl}/${url.short_code}`;
            const longUrl = url.long_url;
            const siteInfo = siteInfos[index];

            tableContent += `
                <tr>
                    <td><a href="${shortUrl}" target="_blank">${shortUrl}</a></td>
                    <td class="site-info">${siteInfo.title || longUrl}</td>
                    <td class="actions">
                        <div class="action-buttons">
                            <button class="view-long-url-btn" data-long-url="${longUrl}" title="View Long URL">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </button>
                            <button class="copy-btn-row" data-short-url="${shortUrl}" title="Copy">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                            <button class="share-btn" data-short-url="${shortUrl}" title="Share">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                            </button>
                            <button class="delete-btn" data-id="${url.id}" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        recentUrlsTableBody.innerHTML = tableContent;
        loadMoreBtn.style.display = 'none';

    } catch (error) {
        console.error('Error fetching recent URLs:', error);
    }
};

    const showLongUrlDialog = (longUrl) => {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.innerHTML = `
            <div class="dialog-box">
                <h3>Full URL</h3>
                <p style="word-break: break-all;">${longUrl}</p>
                <button class="close-dialog">Close</button>
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector('.close-dialog').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
            }
        });
    };

    const handleTableClick = (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const urlId = deleteBtn.dataset.id;
            handleDelete(urlId);
            return;
        }

        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const urlId = editBtn.dataset.id;
            const longUrl = editBtn.dataset.longUrl;
            handleEdit(urlId, longUrl);
            return;
        }

        const shareBtn = e.target.closest('.share-btn');
        if (shareBtn) {
            const shortUrl = shareBtn.dataset.shortUrl;
            handleShare(shortUrl);
            return;
        }

        const copyBtn = e.target.closest('.copy-btn-row');
        if (copyBtn) {
            const shortUrl = copyBtn.dataset.shortUrl;
            copyToClipboard(shortUrl, copyBtn);
            return;
        }

        const viewBtn = e.target.closest('.view-long-url-btn');
        if (viewBtn) {
            const longUrl = viewBtn.dataset.longUrl;
            showLongUrlDialog(longUrl);
            return;
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this URL?')) {
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/urls/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchRecentUrls();
            } else {
                displayError('Failed to delete URL.');
            }
        } catch (error) {
            displayError('Error deleting URL.');
        }
    };

    const handleEdit = async (id, currentLongUrl) => {
        const newLongUrl = prompt('Enter the new long URL:', currentLongUrl);

        if (newLongUrl && newLongUrl !== currentLongUrl && validateUrl(newLongUrl)) {
            try {
                const response = await fetch(`${apiBaseUrl}/urls/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ long_url: newLongUrl }),
                });

                if (response.ok) {
                    fetchRecentUrls();
                } else {
                    displayError('Failed to update URL.');
                }
            } catch (error) {
                displayError('Error updating URL.');
            }
        }
    };

    const handleShare = (shortUrl) => {
        if (navigator.share) {
            navigator.share({
                title: 'Check out this mini URL!',
                text: `Here is a mini URL I created: ${shortUrl}`,
                url: shortUrl,
            })
            .catch((error) => console.error('Error sharing:', error));
        } else {
            // Fallback for browsers that do not support the Web Share API
            navigator.clipboard.writeText(shortUrl).then(() => {
                alert('Share not supported, URL copied to clipboard.');
            });
        }
    };

    shortenBtn.addEventListener('click', shortenUrl);
    copyBtn.addEventListener('click', () => copyToClipboard(shortUrlLink.href, copyBtn));
    recentUrlsTableBody.addEventListener('click', handleTableClick);

    fetchRecentUrls();
});