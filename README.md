# Prime Stream

An infinite prime number generator synchronized to universal time. This application creates a "global stream" of prime numbers where all users see the same prime numbers at the same time, based on a fixed genesis epoch.

## Features

- **Time-Synchronized Prime Generation**: All users see the same prime numbers at the same time, synchronized to a universal clock starting from a genesis epoch (March 14, 2025, 03:14:00 UTC)
- **Live Stream Visualization**: Real-time prime number generation with a visual stream of computed primes
- **Efficient Computation**: Optimized prime checking algorithm using trial division with 6k±1 optimization
- **Infinite Scrolling**: Lazy-loaded history with batched rendering for performance
- **Copy to Clipboard**: Click on the current prime number to copy it
- **Responsive Design**: Beautiful dark-themed UI that works on all screen sizes
- **Buffer Management**: Maintains a rolling buffer of computed primes (up to 5000 numbers)

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JeeNeeUhs/prime.git
cd prime
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## How It Works

### Time Synchronization

The application uses a "Universal Time Protocol" concept where:
- A fixed genesis epoch is set to March 14, 2025, 03:14:00 UTC
- The stream velocity determines how fast the prime search progresses (1 per millisecond)
- Every user's browser calculates the same "global cursor" position based on elapsed time since genesis
- This creates a synchronized experience where all users see approximately the same prime numbers at the same time

### Prime Generation

The app uses an efficient prime checking algorithm:
1. Trial division with basic optimizations (checking divisibility by 2 and 3)
2. 6k±1 optimization for checking potential factors
3. Only odd numbers are checked after 2
4. BigInt support for arbitrarily large primes

### Performance Optimizations

- **Batched Rendering**: Displays history in batches to avoid overwhelming the DOM
- **Intersection Observer**: Loads more history as you scroll up
- **Rolling Buffer**: Maintains a maximum of 5000 primes in memory
- **CPU Throttling**: Slows computation when ahead of the universal clock schedule

## Project Structure

```
prime/
├── App.tsx                     # Main application component
├── index.tsx                   # React entry point
├── index.html                  # HTML template
├── services/
│   ├── mathService.ts         # Prime number algorithms
│   └── persistenceService.ts  # Time synchronization logic
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
└── metadata.json              # Application metadata
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run clean` - Clean generated files

## License

This project is private and not licensed for public use.

## Acknowledgments

Built with modern web technologies to demonstrate real-time synchronized computation across distributed clients.
