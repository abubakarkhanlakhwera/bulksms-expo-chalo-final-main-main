module.exports = {
  useRouter: () => ({ push: () => {} }),
  usePathname: () => "/",
  Link: ({ children }) => children,
};
