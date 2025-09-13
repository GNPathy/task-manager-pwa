// This script will generate all the necessary icon sizes for the PWA
// Run this in the browser console to generate the icons

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a canvas to generate the icon
const generateIcon = (size) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#4a76a8';
    ctx.fillRect(0, 0, size, size);
    
    // Draw a simple checkmark
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = size / 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const padding = size * 0.2;
    ctx.moveTo(padding, size / 2);
    ctx.lineTo(size / 2.5, size - padding);
    ctx.lineTo(size - padding, padding);
    ctx.stroke();
    
    return canvas.toDataURL('image/png');
};

// Generate and download all icons
iconSizes.forEach(size => {
    const link = document.createElement('a');
    link.download = `icon-${size}x${size}.png`;
    link.href = generateIcon(size);
    link.click();
});

console.log('Icons generated successfully!');
