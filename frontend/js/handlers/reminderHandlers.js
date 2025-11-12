// Handle reminder toggle
window.handleReminderToggle = async function(id, active) {
    try {
        await updateReminder(id, { active });
        loadAndDisplayReminders();
    } catch (error) {
        console.error('Error toggling reminder:', error);
        alert('Failed to update reminder. Please try again.');
    }
}

// Handle reminder deletion
window.handleReminderDelete = async function(id) {
    if (!confirm('Are you sure you want to delete this reminder?')) {
        return;
    }

    try {
        await deleteReminder(id);
        loadAndDisplayReminders();
    } catch (error) {
        console.error('Error deleting reminder:', error);
        alert('Failed to delete reminder. Please try again.');
    }
}