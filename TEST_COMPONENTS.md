# Test Components for Visual Editor

## 1. Simple Form Component (Basic Test)

### JSX Code:
```jsx
import React from 'react'

export default function ContactForm() {
  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '16px'
      }}>Contact Us</h2>
      
      <input
        type="text"
        placeholder="Your Name"
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px'
        }}
      />
      
      <input
        type="email"
        placeholder="Your Email"
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px'
        }}
      />
      
      <button style={{
        width: '100%',
        padding: '12px 24px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer'
      }}>
        Send Message
      </button>
    </div>
  )
}
```

### CSS Code:
```css
/* No additional CSS needed - all styles are inline */
```

---

## 2. Flex Dashboard Card (Intermediate Test)

### JSX Code:
```jsx
import React from 'react'

export default function DashboardCard() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '320px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#111827'
        }}>Total Sales</h3>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#10b981',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ color: 'white', fontSize: '20px' }}>$</span>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <span style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#111827'
        }}>$12,345</span>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            backgroundColor: '#dcfce7',
            color: '#166534',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}>+12.5%</span>
          <span style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>vs last month</span>
        </div>
      </div>
    </div>
  )
}
```

### CSS Code:
```css
/* All styles are inline for this component */
```

---

## 3. Complex Navigation Layout (Advanced Test)

### JSX Code:
```jsx
import React from 'react'

export default function NavbarWithSidebar() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#1f2937',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          color: 'white',
          fontSize: '20px',
          fontWeight: '700',
          marginBottom: '30px'
        }}>Dashboard</div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button style={{
            padding: '12px 16px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            textAlign: 'left',
            cursor: 'pointer'
          }}>Home</button>
          
          <button style={{
            padding: '12px 16px',
            backgroundColor: 'transparent',
            color: '#d1d5db',
            border: 'none',
            borderRadius: '6px',
            textAlign: 'left',
            cursor: 'pointer'
          }}>Analytics</button>
          
          <button style={{
            padding: '12px 16px',
            backgroundColor: 'transparent',
            color: '#d1d5db',
            border: 'none',
            borderRadius: '6px',
            textAlign: 'left',
            cursor: 'pointer'
          }}>Settings</button>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Navigation */}
        <div style={{
          height: '60px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#111827'
          }}>Welcome Back</h1>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <input
              type="search"
              placeholder="Search..."
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                width: '200px'
              }}
            />
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>Profile</button>
          </div>
        </div>
        
        {/* Content Area */}
        <div style={{
          flex: '1',
          padding: '24px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>Recent Activity</h3>
              <p style={{
                color: '#6b7280',
                fontSize: '14px'
              }}>Your recent activities will appear here</p>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>Quick Stats</h3>
              <p style={{
                color: '#6b7280',
                fontSize: '14px'
              }}>Your statistics overview</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### CSS Code:
```css
/* Additional responsive styles */
.navbar-container {
  min-height: 100vh;
}

@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }
}
```

---

## 4. E-commerce Product Card (Real-world Example)

### JSX Code:
```jsx
import React from 'react'

export default function ProductCard() {
  return (
    <div style={{
      maxWidth: '300px',
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease',
      border: '1px solid #e5e7eb'
    }}>
      <img
        src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop"
        alt="Wireless Headphones"
        style={{
          width: '100%',
          height: '200px',
          objectFit: 'cover'
        }}
      />
      
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            lineHeight: '1.4'
          }}>Premium Wireless Headphones</h3>
          
          <button style={{
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#ef4444'
          }}>♡</button>
        </div>
        
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '16px',
          lineHeight: '1.5'
        }}>
          High-quality wireless headphones with noise cancellation and 30-hour battery life.
        </p>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827'
            }}>$299</span>
            <span style={{
              fontSize: '16px',
              color: '#9ca3af',
              textDecoration: 'line-through'
            }}>$399</span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ color: '#fbbf24', fontSize: '14px' }}>★★★★★</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>(125)</span>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button style={{
            flex: '1',
            padding: '12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>Add to Cart</button>
          
          <button style={{
            padding: '12px 16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>Buy Now</button>
        </div>
      </div>
    </div>
  )
}
```

### CSS Code:
```css
.product-card:hover {
  transform: translateY(-4px);
}

.product-card button:hover {
  opacity: 0.9;
}
```

---

## 5. Login Form with Validation (Form Testing)

### JSX Code:
```jsx
import React from 'react'

export default function LoginForm() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px'
          }}>Welcome Back</h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>Please sign in to your account</p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'border-color 0.2s'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            required
            minLength={8}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'border-color 0.2s'
            }}
          />
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="remember"
              style={{
                width: '16px',
                height: '16px',
                accentColor: '#3b82f6'
              }}
            />
            <label htmlFor="remember" style={{
              fontSize: '14px',
              color: '#374151'
            }}>Remember me</label>
          </div>
          
          <button style={{
            fontSize: '14px',
            color: '#3b82f6',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}>Forgot password?</button>
        </div>
        
        <button style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '20px'
        }}>Sign In</button>
        
        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Don't have an account? <button style={{
            color: '#3b82f6',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '14px'
          }}>Sign up</button>
        </div>
      </div>
    </div>
  )
}
```

### CSS Code:
```css
input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

button:hover {
  opacity: 0.9;
}
```

---

## How to Test:

1. **Go to your Visual Component Builder** (running on localhost)
2. **Navigate to Edit Component page** or create a new component  
3. **Switch to "Source Code" tab**
4. **Copy one of the JSX codes above** and paste it into the JSX editor
5. **Copy the corresponding CSS code** and paste it into the CSS editor
6. **Switch to "Visual Editor" tab** to see the parsed result
7. **Test selecting elements** - especially nested ones in complex layouts
8. **Test the flex controls** on containers with `display: flex`
9. **Test input properties** on the form components

## What to Look For:

✅ **Element Selection**: Can you select nested elements?  
✅ **Container Support**: Do flex containers show the new Flexbox Properties section?  
✅ **Input Controls**: Do input elements show the Input Properties panel?  
✅ **Visual Feedback**: Are containers and children visually distinguishable?  
✅ **Property Changes**: Do changes in the property panel update the visual preview?  

Start with **Component #1 (Simple Form)** and work your way up to test progressively more complex layouts!
