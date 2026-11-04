<?php
/**
 * Site header.
 *
 * @package mansa
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip" href="#main">Ir para o conteúdo</a>
<header class="site-header">
	<div class="wrap header-row">
		<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php bloginfo( 'name' ); ?> — início">
			<svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#1F3D36"/><g fill="#FAF6EF"><ellipse cx="20" cy="26" rx="7" ry="5.5"/><ellipse cx="11.5" cy="19" rx="2.8" ry="3.6"/><ellipse cx="28.5" cy="19" rx="2.8" ry="3.6"/><ellipse cx="16" cy="13" rx="2.8" ry="3.6"/><ellipse cx="24" cy="13" rx="2.8" ry="3.6"/></g></svg>
			<span>Mansa<small>clínica veterinária</small></span>
		</a>
		<button class="nav-toggle" aria-expanded="false" aria-controls="primary-nav"><span class="sr">Menu</span><i></i></button>
		<nav id="primary-nav" class="primary-nav" aria-label="Principal">
			<?php
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'container'      => false,
				'fallback_cb'    => 'mansa_fallback_menu',
				'depth'          => 1,
			) );
			?>
			<a class="btn btn-small" href="<?php echo esc_url( home_url( '/#contato' ) ); ?>">Agendar consulta</a>
		</nav>
	</div>
</header>
<main id="main">
