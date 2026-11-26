/**
 * Validate and replace req.body / req.query / req.params with the parsed values.
 * Usage: router.post('/', validate({ body: schema }), controller)
 */
export function validate(schemas) {
  return (req, res, next) => {
    for (const part of ['params', 'query', 'body']) {
      if (schemas[part]) {
        const parsed = schemas[part].parse(req[part] ?? {});
        // Express 5 makes req.query a getter, so store parsed values separately.
        req.valid = { ...(req.valid || {}), [part]: parsed };
      }
    }
    next();
  };
}
