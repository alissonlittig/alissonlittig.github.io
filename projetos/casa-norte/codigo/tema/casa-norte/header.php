<?php
/**
 * Site header.
 *
 * @package casanorte
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0B2433">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip" href="#main">Ir para o conteúdo</a>
<header class="site-header">
	<div class="wrap header-row">
		<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php bloginfo( 'name' ); ?> — início">
			<svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="#0F5C63"/><path d="M8 21 20 10l12 11" fill="none" stroke="#F2F4F1" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 20v10h14V20" fill="none" stroke="#F2F4F1" stroke-width="2.6" stroke-linejoin="round"/><rect x="18" y="23" width="4" height="7" fill="#B98A3A"/></svg>
			<span>Casa Norte<small>imóveis</small></span>
		</a>
		<button class="nav-toggle" aria-expanded="false" aria-controls="primary-nav"><span class="sr">Menu</span><i></i></button>
		<nav id="primary-nav" class="primary-nav" aria-label="Principal">
			<?php
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'container'      => false,
				'fallback_cb'    => 'cn_fallback_menu',
				'depth'          => 1,
			) );
			?>
			<a class="btn btn-small" href="<?php echo esc_url( home_url( '/#contato' ) ); ?>">Falar com a gente</a>
		</nav>
	</div>
</header>
<main id="main">
